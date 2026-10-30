import crypto from 'node:crypto';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import express from 'express';
import multer from 'multer';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { config, emailConfigured } from './config.js';
import { pool, inTransaction, ensureDatabaseReady } from './db.js';
import { canTransitionOrder, stockAvailability } from './domain.js';
import { enqueueEmail } from './email.js';

const app = express();
const PgSession = connectPgSimple(session);
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const productUploadDir = path.join(publicDir, 'uploads', 'products');
const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new HttpError(415, 'Choose a JPEG, PNG, or WebP image.', 'IMAGE_TYPE_UNSUPPORTED'));
    }
    callback(null, true);
  },
});
const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(12).max(128)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be 72 UTF-8 bytes or fewer.');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait before trying again.' },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
const dummyPasswordHash = bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

if (config.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://www.googletagmanager.com'],
      styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://analytics.google.com'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'data:'],
      frameSrc: ["'self'", 'https://www.google.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.isProduction ? [] : null,
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  res.on('finish', () => {
    console.info(JSON.stringify({
      level: 'info',
      event: 'http_request',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
const sessionStore = new PgSession({
  pool,
  tableName: 'user_sessions',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15,
});
sessionStore.on('error', (error) => {
  console.warn('Session store database warning:', error.message);
});

app.use(session({
  store: sessionStore,
  name: 'brmc.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Invalid request.', 'VALIDATION_ERROR');
  }
  return result.data;
}

function uuidParam(req, key) {
  return parse(z.string().uuid(), req.params[key]);
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function requireCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const expected = req.session.csrfToken;
  const supplied = req.get('x-csrf-token');
  const expectedBuffer = Buffer.from(expected ?? '');
  const suppliedBuffer = Buffer.from(supplied ?? '');
  if (!expected || !supplied || expectedBuffer.length !== suppliedBuffer.length
      || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return next(new HttpError(403, 'Your session expired. Refresh the page and try again.', 'CSRF_INVALID'));
  }
  next();
}

app.use('/api', requireCsrf);

const requireUser = (req, _res, next) => {
  if (!req.session.userId) return next(new HttpError(401, 'Please sign in to continue.', 'AUTH_REQUIRED'));
  pool.query(
    `SELECT id, email, full_name, role, email_verified_at,
       (password_hash IS NOT NULL) AS has_password
     FROM users WHERE id = $1`,
    [req.session.userId],
  ).then((result) => {
    if (!result.rowCount) {
      req.session.destroy(() => {});
      return next(new HttpError(401, 'Please sign in to continue.', 'AUTH_REQUIRED'));
    }
    req.user = result.rows[0];
    next();
  }).catch(next);
};

const requireVerifiedUser = [
  requireUser,
  (req, _res, next) => {
    if (!req.user.email_verified_at) return next(new HttpError(403, 'Verify your email address before continuing.', 'EMAIL_NOT_VERIFIED'));
    next();
  },
];

const requireAdmin = [
  requireUser,
  (req, _res, next) => {
    if (req.user.role !== 'admin') return next(new HttpError(403, 'Admin access is required.', 'ADMIN_REQUIRED'));
    next();
  },
];

function notifyUser(client, userId, kind, title, body, href = null) {
  return client.query(
    `INSERT INTO notifications (user_id, kind, title, body, href)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, kind, title, body, href],
  );
}

async function enqueueTemplate(client, userId, recipient, template, payload) {
  if (!emailConfigured || !recipient) return;
  await enqueueEmail(client, { userId, recipient, template, payload });
}

async function notifyAdmins(client, title, body, kind = 'inventory') {
  const admins = await client.query("SELECT id, email FROM users WHERE role = 'admin'");
  for (const admin of admins.rows) {
    await notifyUser(client, admin.id, kind, title, body);
    await enqueueTemplate(client, admin.id, admin.email, 'admin_alert', { title, body });
  }
}

async function notifyRestockSubscribers(client, variantId, productName, packSize) {
  const subscribers = await client.query(
    `SELECT rs.id, u.id AS user_id, u.email
     FROM restock_subscriptions rs JOIN users u ON u.id = rs.user_id
     WHERE rs.variant_id = $1 FOR UPDATE OF rs`,
    [variantId],
  );
  for (const subscriber of subscribers.rows) {
    await notifyUser(
      client,
      subscriber.user_id,
      'restock',
      'Product option back in stock',
      `${productName} (${packSize}) is available again.`,
      '/shop',
    );
    await enqueueTemplate(client, subscriber.user_id, subscriber.email, 'back_in_stock', { productName, packSize });
  }
  await client.query('DELETE FROM restock_subscriptions WHERE variant_id = $1', [variantId]);
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
}));

app.get('/api/csrf', (req, res) => {
  const token = req.session ? (req.session.csrfToken ||= randomToken()) : randomToken();
  res.set('Cache-Control', 'no-store');
  res.json({ csrfToken: token });
});

async function getBusinessDetails() {
  try {
    await pool.query(
      `INSERT INTO business_details (id, address, phone, email, whatsapp)
       VALUES (1, $1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
      [config.businessAddress, config.businessPhone, config.businessEmail, config.businessWhatsapp],
    );
    const result = await pool.query(
      'SELECT address, phone, email, whatsapp, hours, latitude, longitude FROM business_details WHERE id = 1',
    );
    const details = result.rows[0];
    return {
      supportEmail: details?.email ?? config.businessEmail,
      supportPhone: details?.phone ?? config.businessPhone,
      whatsapp: details?.whatsapp ?? config.businessWhatsapp,
      supportAddress: details?.address ?? config.businessAddress,
      businessHours: details?.hours ?? '',
      businessLatitude: details?.latitude ?? null,
      businessLongitude: details?.longitude ?? null,
    };
  } catch (err) {
    console.warn('Could not query business details from database, using config fallback:', err.message);
    return {
      supportEmail: config.businessEmail,
      supportPhone: config.businessPhone,
      whatsapp: config.businessWhatsapp,
      supportAddress: config.businessAddress,
      businessHours: '',
      businessLatitude: null,
      businessLongitude: null,
    };
  }
}

app.get('/api/config', asyncRoute(async (_req, res) => {
  void ensureDatabaseReady();
  const businessDetails = await getBusinessDetails();
  res.json({
    businessName: config.businessName,
    ...Object.fromEntries(Object.entries(businessDetails).map(([key, value]) => [key, value ?? null])),
    emailConfigured,
    googleConfigured: Boolean(config.googleClientId && config.googleClientSecret && config.googleCallbackUrl),
    paymentsEnabled: false,
    paymentMethods: config.paymentMethods,
    analyticsId: config.ga4MeasurementId || null,
  });
}));

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
  await ensureDatabaseReady();
  if (!emailConfigured) {
    throw new HttpError(503, 'Email verification is unavailable until SMTP is configured.', 'EMAIL_UNAVAILABLE');
  }
  const data = parse(z.object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().max(128),
    acceptTerms: z.literal(true),
  }).refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  }), req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const rawToken = randomToken();
  const user = await inTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name`,
      [data.email, passwordHash, data.fullName],
    );
    const created = inserted.rows[0];
    await client.query(
      `INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, 'verify', $2, NOW() + INTERVAL '24 hours')`,
      [created.id, hashToken(rawToken)],
    );
    await enqueueTemplate(client, created.id, created.email, 'verify', {
      name: created.full_name,
      link: `${config.baseUrl}/verify?token=${encodeURIComponent(rawToken)}`,
    });
    return created;
  });
  res.status(201).json({
    message: emailConfigured
      ? 'Account created. Check your email to verify your address.'
      : 'Account created, but verification email is unavailable until the owner configures SMTP.',
    emailConfigured,
    user: { id: user.id, email: user.email, fullName: user.full_name },
  });
}));

app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
  await ensureDatabaseReady();
  const data = parse(z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  }), req.body);
  const result = await pool.query(
    'SELECT id, email, full_name, role, password_hash, email_verified_at FROM users WHERE email = $1',
    [data.email],
  );
  const user = result.rows[0];
  const passwordMatches = await bcrypt.compare(
    data.password,
    user?.password_hash ?? await dummyPasswordHash,
  );
  if (!user || !user.password_hash || !passwordMatches || !user.email_verified_at) {
    throw new HttpError(401, 'Sign-in could not be completed. Check your details or verify your account.', 'LOGIN_FAILED');
  }
  await new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
  req.session.userId = user.id;
  req.session.csrfToken = randomToken();
  res.json({
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    csrfToken: req.session.csrfToken,
  });
}));

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  await new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
  res.clearCookie('brmc.sid', { httpOnly: true, secure: config.isProduction, sameSite: 'lax' });
  res.status(204).end();
}));

app.get('/api/auth/me', requireUser, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      emailVerified: Boolean(req.user.email_verified_at),
      hasPassword: req.user.has_password,
    },
  });
});

app.get('/api/auth/verify', asyncRoute(async (req, res) => {
  const token = parse(z.string().min(20).max(200), req.query.token);
  await inTransaction(async (client) => {
    const result = await client.query(
      `UPDATE email_tokens SET consumed_at = NOW()
       WHERE token_hash = $1 AND purpose = 'verify' AND consumed_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [hashToken(token)],
    );
    if (!result.rowCount) throw new HttpError(400, 'This verification link is invalid or has expired.', 'TOKEN_INVALID');
    const user = await client.query(
      'UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, email, full_name',
      [result.rows[0].user_id],
    );
    await enqueueTemplate(client, user.rows[0].id, user.rows[0].email, 'welcome', { name: user.rows[0].full_name });
  });
  res.json({ message: 'Email verified. You can now sign in.' });
}));

app.post('/api/auth/verification/resend', authLimiter, asyncRoute(async (req, res) => {
  if (!emailConfigured) {
    throw new HttpError(503, 'Email verification is unavailable until SMTP is configured.', 'EMAIL_UNAVAILABLE');
  }
  const data = parse(z.object({ email: emailSchema }), req.body);
  const result = await pool.query('SELECT id, email, full_name, email_verified_at FROM users WHERE email = $1', [data.email]);
  if (result.rowCount && !result.rows[0].email_verified_at) {
    const user = result.rows[0];
    const token = randomToken();
    await inTransaction(async (client) => {
      await client.query(
        `UPDATE email_tokens SET consumed_at = NOW()
         WHERE user_id = $1 AND purpose = 'verify' AND consumed_at IS NULL`,
        [user.id],
      );
      await client.query(
        `INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'verify', $2, NOW() + INTERVAL '24 hours')`,
        [user.id, hashToken(token)],
      );
      await enqueueTemplate(client, user.id, user.email, 'verify', {
        name: user.full_name,
        link: `${config.baseUrl}/verify?token=${encodeURIComponent(token)}`,
      });
    });
  }
  res.json({
    message: 'If that account needs verification, instructions will be sent.',
    emailConfigured,
  });
}));

app.post('/api/auth/forgot-password', authLimiter, asyncRoute(async (req, res) => {
  const data = parse(z.object({ email: emailSchema }), req.body);
  const result = await pool.query('SELECT id, email, full_name FROM users WHERE email = $1', [data.email]);
  if (result.rowCount) {
    const user = result.rows[0];
    const token = randomToken();
    await inTransaction(async (client) => {
      await client.query(
        `UPDATE email_tokens SET consumed_at = NOW()
         WHERE user_id = $1 AND purpose = 'reset' AND consumed_at IS NULL`,
        [user.id],
      );
      await client.query(
        `INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'reset', $2, NOW() + INTERVAL '30 minutes')`,
        [user.id, hashToken(token)],
      );
      await enqueueTemplate(client, user.id, user.email, 'password_reset', {
        name: user.full_name,
        link: `${config.baseUrl}/reset-password?token=${encodeURIComponent(token)}`,
      });
    });
  }
  res.json({
    message: 'If an account exists for that email, password reset instructions will be sent.',
    emailConfigured,
  });
}));

app.post('/api/auth/reset-password', authLimiter, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string().max(128),
  }).refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  }), req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const updated = await inTransaction(async (client) => {
    const tokenResult = await client.query(
      `UPDATE email_tokens SET consumed_at = NOW()
       WHERE token_hash = $1 AND purpose = 'reset' AND consumed_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [hashToken(data.token)],
    );
    if (!tokenResult.rowCount) throw new HttpError(400, 'This reset link is invalid or has expired.', 'TOKEN_INVALID');
    const user = await client.query(
      'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING id, email',
      [tokenResult.rows[0].user_id, passwordHash],
    );
    await client.query('DELETE FROM user_sessions WHERE sess::jsonb ->> \'userId\' = $1', [user.rows[0].id]);
    await enqueueTemplate(client, user.rows[0].id, user.rows[0].email, 'password_changed', {});
    return user.rows[0].id;
  });
  res.json({ message: 'Password updated. Please sign in again.', account: updated });
}));

app.get('/api/auth/google', (req, res, next) => {
  if (!config.googleClientId || !config.googleClientSecret || !config.googleCallbackUrl) {
    return next(new HttpError(503, 'Google sign-in is not configured.', 'OAUTH_UNAVAILABLE'));
  }
  const state = randomToken();
  req.session.googleState = state;
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleCallbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', asyncRoute(async (req, res) => {
  const state = parse(z.string().min(20).max(200), req.query.state);
  if (!req.session.googleState || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(req.session.googleState))) {
    throw new HttpError(400, 'Google sign-in could not be verified.', 'OAUTH_STATE_INVALID');
  }
  delete req.session.googleState;
  const code = parse(z.string().min(1).max(2000), req.query.code);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleCallbackUrl,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) throw new HttpError(401, 'Google sign-in was not completed.', 'OAUTH_FAILED');
  const tokenData = await tokenResponse.json();
  if (typeof tokenData.id_token !== 'string') throw new HttpError(401, 'Google did not return a verified identity.', 'OAUTH_FAILED');
  const identityResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!identityResponse.ok) throw new HttpError(401, 'Google identity verification failed.', 'OAUTH_FAILED');
  const identity = await identityResponse.json();
  if (identity.aud !== config.googleClientId || identity.email_verified !== 'true'
      || !identity.sub || !identity.email || !identity.name) {
    throw new HttpError(401, 'Google did not return a verified account.', 'OAUTH_FAILED');
  }
  const result = await inTransaction(async (client) => {
    const existing = await client.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.email_verified_at FROM oauth_identities oi
       JOIN users u ON u.id = oi.user_id
       WHERE oi.provider = 'google' AND oi.provider_subject = $1`,
      [identity.sub],
    );
    if (existing.rowCount) {
      return { user: existing.rows[0], verificationRequired: !existing.rows[0].email_verified_at };
    }
    const email = parse(emailSchema, identity.email);
    let account = await client.query(
      'SELECT id, email, full_name, role, email_verified_at FROM users WHERE email = $1',
      [email],
    );
    if ((!account.rowCount || !account.rows[0].email_verified_at) && !emailConfigured) {
      throw new HttpError(503, 'Email verification is unavailable until SMTP is configured.', 'EMAIL_UNAVAILABLE');
    }
    if (!account.rowCount) {
      account = await client.query(
        `INSERT INTO users (email, full_name, role)
         VALUES ($1, $2, 'customer')
         RETURNING id, email, full_name, role, email_verified_at`,
        [email, String(identity.name).slice(0, 100)],
      );
    }
    await client.query(
      `INSERT INTO oauth_identities (user_id, provider, provider_subject)
       VALUES ($1, 'google', $2)`,
      [account.rows[0].id, identity.sub],
    );
    const user = account.rows[0];
    if (!user.email_verified_at) {
      const verificationToken = randomToken();
      await client.query(
        `UPDATE email_tokens SET consumed_at = NOW()
         WHERE user_id = $1 AND purpose = 'verify' AND consumed_at IS NULL`,
        [user.id],
      );
      await client.query(
        `INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'verify', $2, NOW() + INTERVAL '24 hours')`,
        [user.id, hashToken(verificationToken)],
      );
      await enqueueTemplate(client, user.id, user.email, 'verify', {
        name: user.full_name,
        link: `${config.baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`,
      });
      return { user, verificationRequired: true };
    }
    return { user, verificationRequired: false };
  });
  if (result.verificationRequired) {
    res.redirect('/login?verification=pending');
    return;
  }
  const { user } = result;
  await new Promise((resolve, reject) => req.session.regenerate((error) => (error ? reject(error) : resolve())));
  req.session.userId = user.id;
  req.session.csrfToken = randomToken();
  res.redirect('/account');
}));

app.get('/api/profile', requireUser, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      emailVerified: Boolean(req.user.email_verified_at),
    },
  });
});

app.patch('/api/profile', requireVerifiedUser, asyncRoute(async (req, res) => {
  const data = parse(z.object({ fullName: z.string().trim().min(2).max(100) }), req.body);
  const result = await pool.query(
    'UPDATE users SET full_name = $2, updated_at = NOW() WHERE id = $1 RETURNING id, email, full_name',
    [req.user.id, data.fullName],
  );
  res.json({ user: { id: result.rows[0].id, email: result.rows[0].email, fullName: result.rows[0].full_name } });
}));

const emailPreferencesSchema = z.object({
  orderUpdates: z.boolean(),
  enquiryAcknowledgements: z.boolean(),
  backInStock: z.boolean(),
  promotions: z.boolean(),
});

app.get('/api/profile/email-preferences', requireUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    'SELECT email_preferences AS preferences FROM users WHERE id = $1',
    [req.user.id],
  );
  res.json({ preferences: result.rows[0].preferences });
}));

app.put('/api/profile/email-preferences', requireUser, asyncRoute(async (req, res) => {
  const preferences = parse(emailPreferencesSchema, req.body);
  const result = await pool.query(
    `UPDATE users SET email_preferences = $2::jsonb, updated_at = NOW()
     WHERE id = $1 RETURNING email_preferences AS preferences`,
    [req.user.id, JSON.stringify(preferences)],
  );
  res.json({ preferences: result.rows[0].preferences });
}));

app.get('/api/admin/business-details', requireAdmin, asyncRoute(async (_req, res) => {
  const details = await getBusinessDetails();
  res.json({
    details: {
      address: details.supportAddress,
      phone: details.supportPhone,
      email: details.supportEmail,
      whatsapp: details.whatsapp,
      hours: details.businessHours,
      latitude: details.businessLatitude,
      longitude: details.businessLongitude,
    },
  });
}));

app.put('/api/admin/business-details', requireAdmin, asyncRoute(async (req, res) => {
  const optionalEmail = z.string().trim().max(254).refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Enter a valid contact email address.',
  );
  const details = parse(z.object({
    address: z.string().trim().max(500).default(''),
    phone: z.string().trim().max(40).default(''),
    email: optionalEmail.default(''),
    whatsapp: z.string().trim().max(40).default(''),
    hours: z.string().trim().max(300).default(''),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
  }).refine((value) => (value.latitude === null) === (value.longitude === null), {
    message: 'Choose both map coordinates together.',
    path: ['longitude'],
  }), req.body);
  const result = await pool.query(
    `INSERT INTO business_details (id, address, phone, email, whatsapp, hours, latitude, longitude, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (id) DO UPDATE
     SET address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email,
         whatsapp = EXCLUDED.whatsapp, hours = EXCLUDED.hours, latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude, updated_at = NOW()
     RETURNING address, phone, email, whatsapp, hours, latitude, longitude`,
    [details.address, details.phone, details.email, details.whatsapp, details.hours, details.latitude, details.longitude],
  );
  res.json({ details: result.rows[0] });
}));

app.delete('/api/account', requireUser, asyncRoute(async (req, res) => {
  const confirmation = parse(z.object({
    currentPassword: z.string().max(128).optional(),
    confirm: z.literal('DELETE'),
  }), req.body);
  if (req.user.role === 'admin') throw new HttpError(409, 'Admin accounts must be transferred through a secure owner-managed process.', 'ADMIN_ACCOUNT_PROTECTED');
  const account = await pool.query('SELECT password_hash, email FROM users WHERE id = $1', [req.user.id]);
  if (!account.rows[0]?.password_hash) {
    if (confirmation.currentPassword) {
      throw new HttpError(400, 'This account uses Google sign-in; no password is needed.', 'PASSWORD_NOT_APPLICABLE');
    }
  } else if (!confirmation.currentPassword
      || !(await bcrypt.compare(confirmation.currentPassword, account.rows[0].password_hash))) {
    throw new HttpError(401, 'Current password is incorrect.', 'PASSWORD_INVALID');
  }
  await inTransaction(async (client) => {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    const activeOrders = await client.query(
      `SELECT 1 FROM orders
       WHERE user_id = $1 AND status NOT IN ('delivered', 'rejected', 'cancelled')
       LIMIT 1 FOR UPDATE`,
      [req.user.id],
    );
    if (activeOrders.rowCount) throw new HttpError(409, 'Cancel or complete active order requests before deleting your account.', 'ACTIVE_ORDERS');
    await client.query('DELETE FROM restock_subscriptions WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM carts WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM addresses WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM email_tokens WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM oauth_identities WHERE user_id = $1', [req.user.id]);
    await client.query(
      'DELETE FROM enquiries WHERE user_id = $1 OR email = $2',
      [req.user.id, account.rows[0].email],
    );
    await client.query(
      'DELETE FROM email_jobs WHERE user_id = $1 OR recipient = $2',
      [req.user.id, account.rows[0].email],
    );
    await client.query(
      `UPDATE orders SET address_snapshot = '{"deleted":true}'::jsonb, customer_note = '', updated_at = NOW()
       WHERE user_id = $1`,
      [req.user.id],
    );
    await client.query(
      `UPDATE order_status_history SET note = ''
       WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)`,
      [req.user.id],
    );
    await client.query(
      `UPDATE payments SET provider_reference = NULL
       WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)`,
      [req.user.id],
    );
    await client.query(
      `UPDATE users SET email = $2, password_hash = NULL, full_name = 'Deleted account',
         email_verified_at = NULL, updated_at = NOW()
       WHERE id = $1`,
      [req.user.id, `deleted-${req.user.id}@deleted.invalid`],
    );
    await client.query("DELETE FROM user_sessions WHERE sess::jsonb ->> 'userId' = $1", [req.user.id]);
  });
  await new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
  res.clearCookie('brmc.sid', { httpOnly: true, secure: config.isProduction, sameSite: 'lax' });
  res.json({ message: 'Your account has been deleted and remaining order records have been anonymized.' });
}));

const addressInput = z.object({
  label: z.string().trim().min(1).max(40).default('Home'),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(4).max(150),
  line2: z.string().trim().max(150).optional().default(''),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(4).max(12),
  isDefault: z.boolean().default(false),
});

app.get('/api/addresses', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT id, label, recipient_name AS "recipientName", phone, line1, line2, city, state,
            postal_code AS "postalCode", is_default AS "isDefault"
     FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [req.user.id],
  );
  res.json({ addresses: result.rows });
}));

app.post('/api/addresses', requireVerifiedUser, asyncRoute(async (req, res) => {
  const data = parse(addressInput, req.body);
  const address = await inTransaction(async (client) => {
    if (data.isDefault) await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    const result = await client.query(
      `INSERT INTO addresses (user_id, label, recipient_name, phone, line1, line2, city, state, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, label, recipient_name AS "recipientName", phone, line1, line2, city, state,
                 postal_code AS "postalCode", is_default AS "isDefault"`,
      [req.user.id, data.label, data.recipientName, data.phone, data.line1, data.line2, data.city, data.state, data.postalCode, data.isDefault],
    );
    return result.rows[0];
  });
  res.status(201).json({ address });
}));

app.patch('/api/addresses/:id', requireVerifiedUser, asyncRoute(async (req, res) => {
  const data = parse(addressInput, req.body);
  const addressId = uuidParam(req, 'id');
  const address = await inTransaction(async (client) => {
    if (data.isDefault) await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    const result = await client.query(
      `UPDATE addresses
       SET label = $3, recipient_name = $4, phone = $5, line1 = $6, line2 = $7,
           city = $8, state = $9, postal_code = $10, is_default = $11, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, label, recipient_name AS "recipientName", phone, line1, line2, city, state,
                 postal_code AS "postalCode", is_default AS "isDefault"`,
      [addressId, req.user.id, data.label, data.recipientName, data.phone, data.line1, data.line2, data.city, data.state, data.postalCode, data.isDefault],
    );
    if (!result.rowCount) throw new HttpError(404, 'Address not found.', 'NOT_FOUND');
    return result.rows[0];
  });
  res.json({ address });
}));

app.delete('/api/addresses/:id', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [uuidParam(req, 'id'), req.user.id]);
  if (!result.rowCount) throw new HttpError(404, 'Address not found.', 'NOT_FOUND');
  res.status(204).end();
}));

const productQuery = `
  SELECT p.id, p.slug, p.name, p.description, p.category, p.ingredients, p.storage_instructions,
         COALESCE(
           json_agg(json_build_object(
             'id', v.id, 'sku', v.sku, 'packSize', v.pack_size, 'pricePaise', v.price_paise,
             'stockQuantity', v.stock_quantity, 'lowStockThreshold', v.low_stock_threshold,
             'availability', CASE WHEN v.stock_quantity = 0 THEN 'out_of_stock'
                                  WHEN v.stock_quantity <= v.low_stock_threshold THEN 'low_stock'
                                  ELSE 'in_stock' END
           ) ORDER BY v.pack_size) FILTER (WHERE v.id IS NOT NULL),
           '[]'::json
         ) AS variants,
         COALESCE((
           SELECT json_agg(json_build_object('url', i.image_url, 'altText', i.alt_text) ORDER BY i.sort_order)
           FROM product_images i WHERE i.product_id = p.id
         ), '[]'::json) AS images,
         COALESCE((SELECT COUNT(*)::int FROM product_reviews r WHERE r.product_id = p.id AND r.is_approved = TRUE), 0) AS "reviewCount",
         COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1)::float FROM product_reviews r WHERE r.product_id = p.id AND r.is_approved = TRUE), 0) AS "averageRating"
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = TRUE
`;

app.get('/api/products/:slug/reviews', asyncRoute(async (req, res) => {
  const slug = parse(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), req.params.slug);
  const product = await pool.query('SELECT id FROM products WHERE slug = $1 AND active = TRUE', [slug]);
  if (!product.rowCount) throw new HttpError(404, 'Product not found.', 'NOT_FOUND');
  const productId = product.rows[0].id;
  const [reviewsResult, statsResult] = await Promise.all([
    pool.query(
      `SELECT r.id, r.customer_name AS "customerName", r.rating, r.title, r.comment,
              r.created_at AS "createdAt", (r.user_id IS NOT NULL) AS "verifiedBuyer"
       FROM product_reviews r
       WHERE r.product_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC LIMIT 50`,
      [productId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS "totalCount",
              COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS "averageRating"
       FROM product_reviews
       WHERE product_id = $1 AND is_approved = TRUE`,
      [productId],
    ),
  ]);
  res.json({
    reviews: reviewsResult.rows,
    totalCount: statsResult.rows[0]?.totalCount ?? 0,
    averageRating: statsResult.rows[0]?.averageRating ?? 0,
  });
}));

app.post('/api/products/:slug/reviews', requireVerifiedUser, asyncRoute(async (req, res) => {
  const slug = parse(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), req.params.slug);
  const data = parse(z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(120).default(''),
    comment: z.string().trim().min(5).max(1500),
  }), req.body);
  const product = await pool.query('SELECT id, name FROM products WHERE slug = $1 AND active = TRUE', [slug]);
  if (!product.rowCount) throw new HttpError(404, 'Product not found.', 'NOT_FOUND');
  const productId = product.rows[0].id;

  const inserted = await pool.query(
    `INSERT INTO product_reviews (product_id, user_id, customer_name, rating, title, comment, is_approved)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id, customer_name AS "customerName", rating, title, comment, created_at AS "createdAt"`,
    [productId, req.user.id, req.user.full_name, data.rating, data.title, data.comment],
  );
  await notifyAdmins(
    pool,
    'New product review received',
    `${req.user.full_name} left a ${data.rating}-star review on ${product.rows[0].name}: "${data.comment.slice(0, 80)}"`,
    'review',
  );
  res.status(201).json({
    message: 'Thank you for your feedback! Your review has been published.',
    review: inserted.rows[0],
  });
}));

app.get('/api/products', asyncRoute(async (req, res) => {
  const search = parse(z.string().trim().max(80).optional().default(''), req.query.q);
  const category = parse(z.string().trim().max(60).optional().default(''), req.query.category);
  const parameters = [];
  const filters = ['p.active = TRUE'];
  if (search) {
    parameters.push(`%${search.replace(/[%_]/g, '\\$&')}%`);
    filters.push(`(p.name ILIKE $${parameters.length} ESCAPE '\\' OR p.description ILIKE $${parameters.length} ESCAPE '\\')`);
  }
  if (category) {
    parameters.push(category);
    filters.push(`p.category = $${parameters.length}`);
  }
  try {
    const result = await pool.query(
      `${productQuery} WHERE ${filters.join(' AND ')} GROUP BY p.id ORDER BY p.name LIMIT 100`,
      parameters,
    );
    res.json({ products: result.rows });
  } catch (err) {
    console.warn('Could not query products from database:', err.message);
    res.json({ products: [] });
  }
}));

app.get('/api/products/:slug', asyncRoute(async (req, res) => {
  const slug = parse(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), req.params.slug);
  const result = await pool.query(
    `${productQuery} WHERE p.active = TRUE AND p.slug = $1 GROUP BY p.id`,
    [slug],
  );
  if (!result.rowCount) throw new HttpError(404, 'Product not found.', 'NOT_FOUND');
  res.json({ product: result.rows[0] });
}));

const cartQuery = `
  SELECT ci.variant_id AS "variantId", ci.quantity, p.name AS "productName", p.slug,
         v.sku, v.pack_size AS "packSize", v.price_paise AS "pricePaise",
         v.stock_quantity AS "stockQuantity", v.low_stock_threshold AS "lowStockThreshold",
         p.active AS "productActive", v.active AS "variantActive",
         (SELECT i.image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order LIMIT 1) AS "imageUrl"
  FROM cart_items ci
  JOIN product_variants v ON v.id = ci.variant_id
  JOIN products p ON p.id = v.product_id
`;

app.get('/api/cart', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(`${cartQuery} WHERE ci.user_id = $1 ORDER BY p.name`, [req.user.id]);
  const subtotalPaise = result.rows.reduce((total, item) => {
    if (!item.productActive || !item.variantActive) return total;
    return total + BigInt(item.pricePaise) * BigInt(item.quantity);
  }, 0n);
  res.json({ items: result.rows, subtotalPaise: subtotalPaise.toString() });
}));

app.post('/api/cart/items', requireVerifiedUser, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  }), req.body);
  const updated = await inTransaction(async (client) => {
    const variant = await client.query(
      `SELECT v.id, v.stock_quantity FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = $1 AND v.active = TRUE AND p.active = TRUE FOR UPDATE OF v`,
      [data.variantId],
    );
    if (!variant.rowCount) throw new HttpError(404, 'This product option is unavailable.', 'VARIANT_UNAVAILABLE');
    await client.query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [req.user.id]);
    const current = await client.query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND variant_id = $2',
      [req.user.id, data.variantId],
    );
    const quantity = (current.rows[0]?.quantity ?? 0) + data.quantity;
    if (quantity > 99) throw new HttpError(400, 'A cart line cannot exceed 99 units.', 'QUANTITY_INVALID');
    if (quantity > variant.rows[0].stock_quantity) throw new HttpError(409, 'There is not enough stock for that quantity.', 'INSUFFICIENT_STOCK');
    await client.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
      [req.user.id, data.variantId, quantity],
    );
    return quantity;
  });
  res.status(201).json({ message: 'Added to cart.', quantity: updated });
}));

app.patch('/api/cart/items/:variantId', requireVerifiedUser, asyncRoute(async (req, res) => {
  const quantity = parse(z.number().int().min(1).max(99), req.body.quantity);
  const result = await pool.query(
    `UPDATE cart_items ci SET quantity = $3, updated_at = NOW()
     FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE ci.user_id = $1 AND ci.variant_id = $2 AND v.id = ci.variant_id
       AND v.active = TRUE AND p.active = TRUE AND v.stock_quantity >= $3
     RETURNING ci.quantity`,
    [req.user.id, uuidParam(req, 'variantId'), quantity],
  );
  if (!result.rowCount) throw new HttpError(409, 'Item is unavailable or stock is too low.', 'INSUFFICIENT_STOCK');
  res.json({ quantity: result.rows[0].quantity });
}));

app.delete('/api/cart/items/:variantId', requireVerifiedUser, asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2', [req.user.id, uuidParam(req, 'variantId')]);
  res.status(204).end();
}));

app.post('/api/orders', requireVerifiedUser, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    addressId: z.string().uuid(),
    paymentMethod: z.enum(['cash_on_handover', 'manual_transfer']),
    customerNote: z.string().trim().max(500).optional().default(''),
  }), req.body);
  const idempotencyKey = parse(z.string().uuid(), req.get('idempotency-key'));
  if (!config.paymentMethods.some((method) => method.value === data.paymentMethod)) {
    throw new HttpError(503, 'The selected payment method is not enabled by the business.', 'PAYMENT_METHOD_DISABLED');
  }
  const outcome = await inTransaction(async (client) => {
    const user = await client.query('SELECT email_verified_at FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    if (!user.rowCount || !user.rows[0].email_verified_at) {
      throw new HttpError(403, 'Verify your email address before continuing.', 'EMAIL_NOT_VERIFIED');
    }
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [`${req.user.id}:${idempotencyKey}`],
    );
    const existing = await client.query(
      'SELECT id, order_number, status, total_paise FROM orders WHERE user_id = $1 AND idempotency_key = $2',
      [req.user.id, idempotencyKey],
    );
    if (existing.rowCount) return { order: existing.rows[0], duplicate: true };
    const addressResult = await client.query(
      `SELECT label, recipient_name, phone, line1, line2, city, state, postal_code
       FROM addresses WHERE id = $1 AND user_id = $2`,
      [data.addressId, req.user.id],
    );
    if (!addressResult.rowCount) throw new HttpError(400, 'Select one of your saved delivery addresses.', 'ADDRESS_INVALID');
    const cart = await client.query(
      `${cartQuery} WHERE ci.user_id = $1 ORDER BY ci.variant_id FOR UPDATE OF v`,
      [req.user.id],
    );
    if (!cart.rowCount) throw new HttpError(400, 'Your cart is empty.', 'CART_EMPTY');
    const itemData = [];
    let subtotal = 0n;
    for (const item of cart.rows) {
      if (!item.productActive || !item.variantActive) throw new HttpError(409, `${item.productName} is unavailable.`, 'ITEM_UNAVAILABLE');
      const decrement = await client.query(
        `UPDATE product_variants SET stock_quantity = stock_quantity - $2, updated_at = NOW()
         WHERE id = $1 AND active = TRUE AND stock_quantity >= $2
         RETURNING stock_quantity`,
        [item.variantId, item.quantity],
      );
      if (!decrement.rowCount) throw new HttpError(409, `Not enough stock for ${item.productName} (${item.packSize}).`, 'INSUFFICIENT_STOCK');
      if (item.stockQuantity > item.lowStockThreshold
          && decrement.rows[0].stock_quantity <= item.lowStockThreshold) {
        await notifyAdmins(
          client,
          'Product stock is low',
          `${item.productName} (${item.packSize}) has ${decrement.rows[0].stock_quantity} units remaining.`,
        );
      }
      const lineTotal = BigInt(item.pricePaise) * BigInt(item.quantity);
      subtotal += lineTotal;
      itemData.push({ ...item, lineTotal: lineTotal.toString() });
    }
    const orderNumber = `BR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const total = subtotal;
    const address = addressResult.rows[0];
    const created = await client.query(
      `INSERT INTO orders (
         order_number, user_id, address_snapshot, status, payment_method,
         subtotal_paise, delivery_fee_paise, total_paise, idempotency_key, customer_note
       ) VALUES ($1, $2, $3::jsonb, 'awaiting_confirmation', $4, $5, 0, $5, $6, $7)
       RETURNING id, order_number, status, payment_status, total_paise, created_at`,
      [orderNumber, req.user.id, JSON.stringify(address), data.paymentMethod, subtotal.toString(), idempotencyKey, data.customerNote],
    );
    const order = created.rows[0];
    for (const item of itemData) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, product_name, sku, pack_size, unit_price_paise, quantity, line_total_paise)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [order.id, item.variantId, item.productName, item.sku, item.packSize, item.pricePaise, item.quantity, item.lineTotal],
      );
      await client.query(
        `INSERT INTO inventory_movements (variant_id, order_id, quantity_change, reason)
         VALUES ($1, $2, $3, 'order_reserved')`,
        [item.variantId, order.id, -item.quantity],
      );
    }
    await client.query(
      `INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, NULL, 'awaiting_confirmation', 'Order request received')`,
      [order.id, req.user.id],
    );
    await notifyUser(client, req.user.id, 'order', 'Order request received', `${orderNumber} is awaiting availability confirmation.`, `/orders/${order.id}`);
    await notifyAdmins(
      client,
      'New order request',
      `${orderNumber} was submitted and is awaiting confirmation.`,
      'order',
    );
    await enqueueTemplate(client, req.user.id, req.user.email, 'order_received', {
      orderNumber,
      status: 'Awaiting admin confirmation',
      items: itemData.map((item) => ({
        productName: item.productName,
        packSize: item.packSize,
        quantity: item.quantity,
        lineTotalPaise: item.lineTotal,
      })),
      subtotalPaise: subtotal.toString(),
      deliveryFeePaise: '0',
      totalPaise: total.toString(),
      paymentStatus: 'unpaid',
      address,
    });
    if (config.adminAlertEmail) {
      await enqueueTemplate(client, null, config.adminAlertEmail, 'order_received', {
        orderNumber,
        status: 'Awaiting admin confirmation',
        items: itemData.map((item) => ({
          productName: item.productName,
          packSize: item.packSize,
          quantity: item.quantity,
          lineTotalPaise: item.lineTotal,
        })),
        subtotalPaise: subtotal.toString(),
        deliveryFeePaise: '0',
        totalPaise: total.toString(),
        paymentStatus: 'unpaid',
        address,
      });
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    return { order, duplicate: false };
  });
  res.status(outcome.duplicate ? 200 : 201).json({
    order: {
      id: outcome.order.id,
      orderNumber: outcome.order.order_number,
      status: outcome.order.status,
      paymentStatus: outcome.order.payment_status,
      totalPaise: String(outcome.order.total_paise),
    },
    duplicate: outcome.duplicate,
  });
}));

app.get('/api/orders', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus",
            total_paise AS "totalPaise", created_at AS "createdAt"
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.user.id],
  );
  res.json({ orders: result.rows });
}));

app.get('/api/orders/:id', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
            o.payment_method AS "paymentMethod", o.subtotal_paise AS "subtotalPaise",
            o.delivery_fee_paise AS "deliveryFeePaise", o.total_paise AS "totalPaise",
            o.address_snapshot AS address, o.customer_note AS "customerNote", o.created_at AS "createdAt",
            COALESCE((SELECT json_agg(json_build_object(
              'productName', oi.product_name, 'sku', oi.sku, 'packSize', oi.pack_size,
              'unitPricePaise', oi.unit_price_paise, 'quantity', oi.quantity, 'lineTotalPaise', oi.line_total_paise
            ) ORDER BY oi.product_name) FROM order_items oi WHERE oi.order_id = o.id), '[]'::json) AS items,
            COALESCE((SELECT json_agg(json_build_object(
              'status', h.new_status, 'note', h.note, 'createdAt', h.created_at
            ) ORDER BY h.created_at) FROM order_status_history h WHERE h.order_id = o.id), '[]'::json) AS history,
            COALESCE((SELECT json_agg(json_build_object(
              'provider', p.provider, 'reference', p.provider_reference, 'status', p.status, 'createdAt', p.created_at
            ) ORDER BY p.created_at DESC) FROM payments p WHERE p.order_id = o.id), '[]'::json) AS payments
     FROM orders o WHERE o.id = $1 AND o.user_id = $2`,
    [uuidParam(req, 'id'), req.user.id],
  );
  if (!result.rowCount) throw new HttpError(404, 'Order not found.', 'NOT_FOUND');
  res.json({ order: result.rows[0] });
}));

async function releaseOrderStock(client, orderId, adminId = null) {
  const items = await client.query(
    'SELECT variant_id, quantity FROM order_items WHERE order_id = $1 AND variant_id IS NOT NULL FOR UPDATE',
    [orderId],
  );
  for (const item of items.rows) {
    const variant = await client.query(
      `SELECT v.id, v.stock_quantity, v.pack_size, p.name
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = $1 FOR UPDATE OF v`,
      [item.variant_id],
    );
    if (!variant.rowCount) continue;
    const result = await client.query(
      'UPDATE product_variants SET stock_quantity = stock_quantity + $2, updated_at = NOW() WHERE id = $1 RETURNING stock_quantity',
      [variant.rows[0].id, item.quantity],
    );
    if (result.rowCount) {
      await client.query(
        `INSERT INTO inventory_movements (variant_id, admin_user_id, order_id, quantity_change, reason)
         VALUES ($1, $2, $3, $4, 'order_cancelled')`,
        [variant.rows[0].id, adminId, orderId, item.quantity],
      );
      if (variant.rows[0].stock_quantity === 0 && result.rows[0].stock_quantity > 0) {
        await notifyRestockSubscribers(client, variant.rows[0].id, variant.rows[0].name, variant.rows[0].pack_size);
      }
    }
  }
}

app.post('/api/orders/:id/cancel', requireVerifiedUser, asyncRoute(async (req, res) => {
  const orderId = uuidParam(req, 'id');
  await inTransaction(async (client) => {
    const result = await client.query('SELECT id, order_number, status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', [orderId, req.user.id]);
    if (!result.rowCount) throw new HttpError(404, 'Order not found.', 'NOT_FOUND');
    const order = result.rows[0];
    if (!canTransitionOrder(order.status, 'cancelled')) throw new HttpError(409, 'This order can no longer be cancelled online.', 'ORDER_STATE_INVALID');
    await client.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [order.id]);
    await releaseOrderStock(client, order.id);
    await client.query(
      `INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, $3, 'cancelled', 'Cancelled by customer')`,
      [order.id, req.user.id, order.status],
    );
    await notifyUser(client, req.user.id, 'order', 'Order cancelled', 'Your order request has been cancelled.', `/orders/${order.id}`);
    const customer = await client.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    await enqueueTemplate(client, req.user.id, customer.rows[0].email, 'order_update', {
      orderNumber: order.order_number,
      status: 'cancelled',
    });
  });
  res.json({ message: 'Order cancelled.' });
}));

app.post('/api/orders/:id/payment-reference', requireVerifiedUser, asyncRoute(async (req, res) => {
  const orderId = uuidParam(req, 'id');
  const data = parse(z.object({
    reference: z.string().trim().min(3).max(100),
  }), req.body);
  await inTransaction(async (client) => {
    const orderResult = await client.query(
      'SELECT id, order_number, total_paise, payment_status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, req.user.id],
    );
    if (!orderResult.rowCount) throw new HttpError(404, 'Order not found.', 'NOT_FOUND');
    const order = orderResult.rows[0];
    if (order.payment_status === 'paid') throw new HttpError(400, 'This order is already marked as paid.', 'ALREADY_PAID');
    await client.query(
      `INSERT INTO payments (order_id, provider, provider_reference, status, amount_paise)
       VALUES ($1, 'manual_upi', $2, 'pending', $3)`,
      [order.id, data.reference, order.total_paise],
    );
    await client.query(
      `UPDATE orders SET payment_status = 'pending', updated_at = NOW() WHERE id = $1`,
      [order.id],
    );
    await client.query(
      `INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, NULL, 'payment_submitted', $3)`,
      [order.id, req.user.id, `Customer submitted payment reference: ${data.reference}`],
    );
    await notifyAdmins(
      client,
      'Payment reference submitted',
      `Payment reference "${data.reference}" was submitted for order ${order.order_number}. Please verify and confirm.`,
      'payment',
    );
  });
  res.json({ message: 'Payment reference submitted successfully. The team will verify and update your order.' });
}));

app.get('/api/notifications', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT id, kind, title, body, href, read_at AS "readAt", created_at AS "createdAt"
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id],
  );
  const unread = await pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL', [req.user.id]);
  res.json({ notifications: result.rows, unreadCount: unread.rows[0].count });
}));

app.patch('/api/notifications/read-all', requireVerifiedUser, asyncRoute(async (req, res) => {
  await pool.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [req.user.id]);
  res.status(204).end();
}));

app.patch('/api/notifications/:id/read', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
    [uuidParam(req, 'id'), req.user.id],
  );
  if (!result.rowCount) throw new HttpError(404, 'Notification not found.', 'NOT_FOUND');
  res.status(204).end();
}));

app.get('/api/notifications/events', requireVerifiedUser, asyncRoute(async (req, res) => {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('event: ready\ndata: {}\n\n');
  if (process.env.VERCEL) {
    res.end();
    return;
  }
  let closed = false;
  let lastCount = -1;
  const timer = setInterval(async () => {
    if (closed) return;
    try {
      const result = await pool.query(
        'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
        [req.user.id],
      );
      if (closed) return;
      if (result.rows[0].count !== lastCount) {
        lastCount = result.rows[0].count;
        res.write(`event: notifications\ndata: ${JSON.stringify({ unreadCount: lastCount })}\n\n`);
      } else {
        res.write(': keep-alive\n\n');
      }
    } catch (error) {
      console.error('Notification stream poll failed:', error.message);
      if (!closed) res.write('event: refresh\ndata: {}\n\n');
    }
  }, 10_000);
  res.on('close', () => {
    closed = true;
    clearInterval(timer);
  });
}));

app.get('/api/admin/events', requireAdmin, asyncRoute(async (req, res) => {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('event: ready\ndata: {}\n\n');
  if (process.env.VERCEL) {
    res.end();
    return;
  }
  const latest = await pool.query(
    `SELECT id FROM notifications
     WHERE user_id = $1 AND kind = 'order'
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id],
  );
  let lastNotificationId = latest.rows[0]?.id ?? null;
  let closed = false;
  const timer = setInterval(async () => {
    if (closed) return;
    try {
      const result = await pool.query(
        `SELECT id, title, body FROM notifications
         WHERE user_id = $1 AND kind = 'order'
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.id],
      );
      if (closed) return;
      const notification = result.rows[0];
      if (notification && notification.id !== lastNotificationId) {
        lastNotificationId = notification.id;
        res.write(`event: admin_order\ndata: ${JSON.stringify(notification)}\n\n`);
      } else {
        res.write(': keep-alive\n\n');
      }
    } catch (error) {
      console.error('Admin order notification stream failed:', error.message);
      if (!closed) res.write('event: refresh\ndata: {}\n\n');
    }
  }, 10_000);
  res.on('close', () => {
    closed = true;
    clearInterval(timer);
  });
}));

app.get('/api/inventory/events', (req, res) => {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  if (process.env.VERCEL) {
    res.write('event: inventory\ndata: {"changed":false}\n\n');
    res.end();
    return;
  }
  let closed = false;
  let lastSnapshot = '';
  const poll = async () => {
    if (closed) return;
    try {
      const result = await pool.query(
        `SELECT v.id, CASE WHEN v.stock_quantity = 0 THEN 'out_of_stock'
                           WHEN v.stock_quantity <= v.low_stock_threshold THEN 'low_stock'
                           ELSE 'in_stock' END AS availability
         FROM product_variants v JOIN products p ON p.id = v.product_id
         WHERE v.active = TRUE AND p.active = TRUE ORDER BY v.id LIMIT 500`,
      );
      if (closed) return;
      const snapshot = JSON.stringify(result.rows);
      if (snapshot !== lastSnapshot) {
        const changed = Boolean(lastSnapshot);
        lastSnapshot = snapshot;
        res.write(`event: inventory\ndata: ${JSON.stringify({ changed })}\n\n`);
      } else {
        res.write(': keep-alive\n\n');
      }
    } catch (error) {
      console.error('Inventory stream poll failed:', error.message);
      if (!closed) res.write('event: refresh\ndata: {}\n\n');
    }
  };
  void poll();
  const timer = setInterval(() => { void poll(); }, 15_000);
  res.on('close', () => {
    closed = true;
    clearInterval(timer);
  });
});

app.post('/api/restock-subscriptions', requireVerifiedUser, asyncRoute(async (req, res) => {
  const variantId = parse(z.string().uuid(), req.body.variantId);
  const result = await pool.query(
    `INSERT INTO restock_subscriptions (user_id, variant_id)
     SELECT $1, v.id FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.id = $2 AND v.active = TRUE AND p.active = TRUE AND v.stock_quantity = 0
     ON CONFLICT (user_id, variant_id) DO NOTHING
     RETURNING id`,
    [req.user.id, variantId],
  );
  if (!result.rowCount) {
    const exists = await pool.query(
      `SELECT 1 FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = $1 AND v.active = TRUE AND p.active = TRUE AND v.stock_quantity = 0`,
      [variantId],
    );
    if (!exists.rowCount) throw new HttpError(409, 'This product option is available or no longer active.', 'SUBSCRIPTION_UNAVAILABLE');
  }
  res.status(201).json({ message: 'You will be notified when this option is available again.' });
}));

app.get('/api/restock-subscriptions', requireVerifiedUser, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT rs.variant_id AS "variantId", p.name AS "productName", p.slug, v.pack_size AS "packSize",
            rs.created_at AS "createdAt"
     FROM restock_subscriptions rs
     JOIN product_variants v ON v.id = rs.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE rs.user_id = $1 ORDER BY rs.created_at DESC LIMIT 100`,
    [req.user.id],
  );
  res.json({ subscriptions: result.rows });
}));

app.delete('/api/restock-subscriptions/:variantId', requireVerifiedUser, asyncRoute(async (req, res) => {
  await pool.query(
    'DELETE FROM restock_subscriptions WHERE user_id = $1 AND variant_id = $2',
    [req.user.id, uuidParam(req, 'variantId')],
  );
  res.status(204).end();
}));

app.post('/api/contact', contactLimiter, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(2000),
  }), req.body);
  await inTransaction(async (client) => {
    await client.query(
      `INSERT INTO enquiries (user_id, name, email, subject, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.userId ?? null, data.name, data.email, data.subject, data.message],
    );
    await enqueueTemplate(client, req.session.userId ?? null, data.email, 'enquiry_received', { name: data.name });
    await notifyAdmins(client, 'New customer enquiry', `A new enquiry was submitted: ${data.subject}.`, 'enquiry');
  });
  res.status(201).json({ message: 'Your enquiry has been received.' });
}));

app.get('/api/admin/summary', requireAdmin, asyncRoute(async (_req, res) => {
  const [orders, stock, enquiries, mail, catalog, customers, visits, reviews] = await Promise.all([
    pool.query(`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`),
    pool.query(`SELECT
      COUNT(*) FILTER (WHERE v.stock_quantity = 0)::int AS out_of_stock,
      COUNT(*) FILTER (WHERE v.stock_quantity > 0 AND v.stock_quantity <= v.low_stock_threshold)::int AS low_stock
      FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.active = TRUE AND v.active = TRUE`),
    pool.query("SELECT COUNT(*)::int AS count FROM enquiries WHERE status = 'new'"),
    pool.query("SELECT COUNT(*)::int AS count FROM email_jobs WHERE status = 'failed'"),
    pool.query('SELECT COUNT(*)::int AS count FROM products'),
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer' AND email NOT LIKE 'deleted-%@deleted.invalid'"),
    pool.query("SELECT metric_value::text AS count FROM site_metrics WHERE metric_key = 'public_page_views'"),
    pool.query("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE is_approved = FALSE)::int AS pending FROM product_reviews"),
  ]);
  res.json({
    ordersByStatus: orders.rows,
    outOfStock: stock.rows[0].out_of_stock,
    lowStock: stock.rows[0].low_stock,
    newEnquiries: enquiries.rows[0].count,
    failedEmails: mail.rows[0].count,
    productCount: catalog.rows[0].count,
    customerCount: customers.rows[0].count,
    pageVisits: visits.rows[0]?.count ?? '0',
    reviewCount: reviews.rows[0]?.count ?? 0,
    pendingReviews: reviews.rows[0]?.pending ?? 0,
  });
}));

const variantInput = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(60),
  packSize: z.string().trim().min(1).max(30),
  priceRupees: z.number().finite().min(0).max(1_000_000),
  stockQuantity: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(5),
  active: z.boolean().default(false),
});
const productImageUrl = z.union([
  z.string().url().refine((value) => value.startsWith('https://'), 'Product image URLs must use HTTPS.'),
  z.string().regex(/^\/uploads\/products\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/),
]);

app.post('/api/admin/products', requireAdmin, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(5000).default(''),
    category: z.string().trim().max(80).default(''),
    ingredients: z.string().trim().max(1000).optional().default(''),
    storageInstructions: z.string().trim().max(1000).optional().default(''),
    active: z.boolean().default(false),
    images: z.array(z.object({
      url: productImageUrl,
      altText: z.string().trim().min(3).max(160),
    })).max(8).default([]),
    variants: z.array(variantInput).min(1).max(20),
  }), req.body);
  const product = await inTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO products (slug, name, description, category, ingredients, storage_instructions, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [data.slug, data.name, data.description, data.category, data.ingredients, data.storageInstructions, data.active],
    );
    const id = inserted.rows[0].id;
    for (const variant of data.variants) {
      const pricePaise = Math.round(variant.priceRupees * 100);
      await client.query(
        `INSERT INTO product_variants (product_id, sku, pack_size, price_paise, stock_quantity, low_stock_threshold, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, variant.sku, variant.packSize, pricePaise, variant.stockQuantity, variant.lowStockThreshold, variant.active],
      );
      if (variant.stockQuantity > 0) {
        const insertedVariant = await client.query('SELECT id FROM product_variants WHERE product_id = $1 AND sku = $2', [id, variant.sku]);
        await client.query(
          `INSERT INTO inventory_movements (variant_id, admin_user_id, quantity_change, reason)
           VALUES ($1, $2, $3, 'initial_stock')`,
          [insertedVariant.rows[0].id, req.user.id, variant.stockQuantity],
        );
      }
    }
    for (const [index, image] of data.images.entries()) {
      await client.query(
        'INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES ($1, $2, $3, $4)',
        [id, image.url, image.altText, index],
      );
    }
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id)
       VALUES ($1, 'product_created', 'product', $2)`,
      [req.user.id, id],
    );
    return { id, slug: data.slug };
  });
  res.status(201).json({ product });
}));

app.patch('/api/admin/products/:id', requireAdmin, asyncRoute(async (req, res) => {
  const productId = uuidParam(req, 'id');
  const data = parse(z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    category: z.string().trim().max(80).optional(),
    ingredients: z.string().trim().max(1000).optional(),
    storageInstructions: z.string().trim().max(1000).optional(),
    active: z.boolean().optional(),
    variants: z.array(variantInput).max(20).optional(),
    images: z.array(z.object({
      url: productImageUrl,
      altText: z.string().trim().min(3).max(160),
    })).max(8).optional(),
  }).refine((value) => Object.keys(value).length > 0), req.body);
  await inTransaction(async (client) => {
    const product = await client.query('SELECT id FROM products WHERE id = $1 FOR UPDATE', [productId]);
    if (!product.rowCount) throw new HttpError(404, 'Product not found.', 'NOT_FOUND');
    const updates = {
      name: data.name,
      description: data.description,
      category: data.category,
      ingredients: data.ingredients,
      storage_instructions: data.storageInstructions,
      active: data.active,
    };
    const sets = [];
    const values = [productId];
    for (const [column, value] of Object.entries(updates)) {
      if (value !== undefined) {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      }
    }
    if (sets.length) {
      await client.query(`UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`, values);
    }
    if (data.variants) {
      for (const variant of data.variants) {
        const pricePaise = Math.round(variant.priceRupees * 100);
        if (variant.id) {
          const before = await client.query('SELECT stock_quantity FROM product_variants WHERE id = $1 AND product_id = $2 FOR UPDATE', [variant.id, productId]);
          if (!before.rowCount) throw new HttpError(400, 'Variant does not belong to this product.', 'VARIANT_INVALID');
          await client.query(
            `UPDATE product_variants
             SET sku = $2, pack_size = $3, price_paise = $4, stock_quantity = $5,
                 low_stock_threshold = $6, active = $7, updated_at = NOW()
             WHERE id = $1`,
            [variant.id, variant.sku, variant.packSize, pricePaise, variant.stockQuantity, variant.lowStockThreshold, variant.active],
          );
          const movement = variant.stockQuantity - before.rows[0].stock_quantity;
          if (movement !== 0) {
            await client.query(
              `INSERT INTO inventory_movements (variant_id, admin_user_id, quantity_change, reason)
               VALUES ($1, $2, $3, 'admin_stock_adjustment')`,
              [variant.id, req.user.id, movement],
            );
          }
          const current = await client.query(
            `SELECT p.name, v.pack_size, v.stock_quantity, v.low_stock_threshold
             FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = $1`,
            [variant.id],
          );
          const currentVariant = current.rows[0];
          if (before.rows[0].stock_quantity === 0 && currentVariant.stock_quantity > 0) {
            await notifyRestockSubscribers(client, variant.id, currentVariant.name, currentVariant.pack_size);
          }
          if (before.rows[0].stock_quantity > currentVariant.low_stock_threshold
              && currentVariant.stock_quantity <= currentVariant.low_stock_threshold) {
            await notifyAdmins(
              client,
              'Product stock is low',
              `${currentVariant.name} (${currentVariant.pack_size}) has ${currentVariant.stock_quantity} units remaining.`,
            );
          }
        } else {
          const inserted = await client.query(
            `INSERT INTO product_variants (product_id, sku, pack_size, price_paise, stock_quantity, low_stock_threshold, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [productId, variant.sku, variant.packSize, pricePaise, variant.stockQuantity, variant.lowStockThreshold, variant.active],
          );
          if (variant.stockQuantity > 0) {
            await client.query(
              `INSERT INTO inventory_movements (variant_id, admin_user_id, quantity_change, reason)
               VALUES ($1, $2, $3, 'initial_stock')`,
              [inserted.rows[0].id, req.user.id, variant.stockQuantity],
            );
          }
        }
      }
    }
    if (data.images) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      for (const [index, image] of data.images.entries()) {
        await client.query(
          'INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES ($1, $2, $3, $4)',
          [productId, image.url, image.altText, index],
        );
      }
    }
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id)
       VALUES ($1, 'product_updated', 'product', $2)`,
      [req.user.id, productId],
    );
  });
  res.json({ message: 'Product updated.' });
}));

app.post('/api/admin/product-images', requireAdmin, productImageUpload.single('image'), asyncRoute(async (req, res) => {
  const image = req.file;
  if (!image) throw new HttpError(400, 'Choose an image to upload.', 'IMAGE_REQUIRED');
  let extension;
  if (image.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    extension = '.png';
  } else if (image.buffer[0] === 0xff && image.buffer[1] === 0xd8 && image.buffer[2] === 0xff) {
    extension = '.jpg';
  } else if (image.buffer.toString('ascii', 0, 4) === 'RIFF'
      && image.buffer.toString('ascii', 8, 12) === 'WEBP') {
    extension = '.webp';
  } else {
    throw new HttpError(415, 'The selected file is not a valid JPEG, PNG, or WebP image.', 'IMAGE_CONTENT_INVALID');
  }
  await mkdir(productUploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}${extension}`;
  await writeFile(path.join(productUploadDir, filename), image.buffer, { flag: 'wx' });
  res.status(201).json({ image: { url: `/uploads/products/${filename}` } });
}));

app.post('/api/admin/products/:id/variants', requireAdmin, asyncRoute(async (req, res) => {
  const data = parse(variantInput.omit({ id: true }), req.body);
  const productId = uuidParam(req, 'id');
  const result = await inTransaction(async (client) => {
    const product = await client.query('SELECT id FROM products WHERE id = $1 FOR UPDATE', [productId]);
    if (!product.rowCount) throw new HttpError(404, 'Product not found.', 'NOT_FOUND');
    const inserted = await client.query(
      `INSERT INTO product_variants (product_id, sku, pack_size, price_paise, stock_quantity, low_stock_threshold, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, sku, pack_size AS "packSize", price_paise AS "pricePaise", stock_quantity AS "stockQuantity", active`,
      [productId, data.sku, data.packSize, Math.round(data.priceRupees * 100), data.stockQuantity, data.lowStockThreshold, data.active],
    );
    if (data.stockQuantity > 0) {
      await client.query(
        `INSERT INTO inventory_movements (variant_id, admin_user_id, quantity_change, reason)
         VALUES ($1, $2, $3, 'initial_stock')`,
        [inserted.rows[0].id, req.user.id, data.stockQuantity],
      );
    }
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id)
       VALUES ($1, 'variant_created', 'variant', $2)`,
      [req.user.id, inserted.rows[0].id],
    );
    return inserted.rows[0];
  });
  res.status(201).json({ variant: result });
}));

app.patch('/api/admin/variants/:id', requireAdmin, asyncRoute(async (req, res) => {
  const data = parse(variantInput.omit({ id: true }), req.body);
  const variantId = uuidParam(req, 'id');
  const result = await inTransaction(async (client) => {
    const before = await client.query(
      `SELECT v.id, v.stock_quantity, v.low_stock_threshold, p.name, v.pack_size
       FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = $1 FOR UPDATE OF v`,
      [variantId],
    );
    if (!before.rowCount) throw new HttpError(404, 'Product option not found.', 'NOT_FOUND');
    const previous = before.rows[0];
    const stockChange = data.stockQuantity - previous.stock_quantity;
    await client.query(
      `UPDATE product_variants
       SET sku = $2, pack_size = $3, price_paise = $4, stock_quantity = $5,
           low_stock_threshold = $6, active = $7, updated_at = NOW()
       WHERE id = $1`,
      [previous.id, data.sku, data.packSize, Math.round(data.priceRupees * 100), data.stockQuantity, data.lowStockThreshold, data.active],
    );
    if (stockChange) {
      await client.query(
        `INSERT INTO inventory_movements (variant_id, admin_user_id, quantity_change, reason)
         VALUES ($1, $2, $3, 'admin_stock_adjustment')`,
        [previous.id, req.user.id, stockChange],
      );
      if (previous.stock_quantity === 0 && data.stockQuantity > 0) {
        await notifyRestockSubscribers(client, previous.id, previous.name, data.packSize);
      }
      if (previous.stock_quantity > previous.low_stock_threshold
          && data.stockQuantity <= data.lowStockThreshold) {
        await notifyAdmins(client, 'Product stock is low', `${previous.name} (${data.packSize}) has ${data.stockQuantity} units remaining.`);
      }
    }
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'variant_updated', 'variant', $2, $3::jsonb)`,
      [req.user.id, previous.id, JSON.stringify({ stockChange, active: data.active })],
    );
    return { id: previous.id };
  });
  res.json({ variant: result });
}));

app.get('/api/admin/orders', requireAdmin, asyncRoute(async (req, res) => {
  const filters = parse(z.object({
    q: z.string().trim().max(120).optional().default(''),
    status: z.enum(['awaiting_confirmation', 'confirmed', 'preparing', 'ready_for_dispatch', 'shipped', 'out_for_delivery', 'delivered', 'rejected', 'cancelled']).optional(),
    payment: z.enum(['unpaid', 'pending', 'paid', 'failed', 'refunded']).optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
    }).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
    }).optional(),
    offset: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }).refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'The start date must be on or before the end date.',
  }), req.query);
  const conditions = [];
  const values = [];
  const addCondition = (sql, value) => {
    values.push(value);
    conditions.push(sql.replace('?', `$${values.length}`));
  };
  if (filters.q) {
    const search = `%${filters.q.replace(/[\\%_]/g, '\\$&')}%`;
    values.push(search);
    const parameter = `$${values.length}`;
    conditions.push(`(o.order_number ILIKE ${parameter} ESCAPE '\\'
      OR u.full_name ILIKE ${parameter} ESCAPE '\\'
      OR u.email ILIKE ${parameter} ESCAPE '\\')`);
  }
  if (filters.status) addCondition('o.status = ?', filters.status);
  if (filters.payment) addCondition('o.payment_status = ?', filters.payment);
  if (filters.from) addCondition("o.created_at >= (?::date::timestamp AT TIME ZONE 'Asia/Kolkata')", filters.from);
  if (filters.to) addCondition("o.created_at < ((?::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Kolkata')", filters.to);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [count, result] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total FROM orders o JOIN users u ON u.id = o.user_id ${where}`,
      values,
    ),
    pool.query(
      `SELECT o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
              o.total_paise AS "totalPaise", o.created_at AS "createdAt", u.email, u.full_name AS "fullName",
              o.address_snapshot->>'phone' AS phone,
              (SELECT provider_reference FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS "paymentReference",
              COALESCE((
                SELECT json_agg(json_build_object(
                  'productName', oi.product_name,
                  'packSize', oi.pack_size,
                  'quantity', oi.quantity
                ) ORDER BY oi.product_name, oi.pack_size)
                FROM order_items oi WHERE oi.order_id = o.id
              ), '[]'::json) AS items
       FROM orders o JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, filters.limit, filters.offset],
    ),
  ]);
  res.json({
    orders: result.rows,
    total: count.rows[0].total,
    offset: filters.offset,
    limit: filters.limit,
    hasMore: filters.offset + result.rows.length < count.rows[0].total,
  });
}));

app.get('/api/admin/customers', requireAdmin, asyncRoute(async (req, res) => {
  const query = parse(z.string().trim().max(120).optional(), req.query.q) ?? '';
  const verification = parse(z.enum(['verified', 'unverified']).optional(), req.query.verification);
  const values = [];
  const conditions = ["u.role = 'customer'", "u.email NOT LIKE 'deleted-%@deleted.invalid'"];
  if (query) {
    values.push(`%${query.replace(/[\\%_]/g, '\\$&')}%`);
    conditions.push(`(u.full_name ILIKE $${values.length} ESCAPE '\\'
      OR u.email ILIKE $${values.length} ESCAPE '\\')`);
  }
  if (verification) {
    conditions.push(verification === 'verified' ? 'u.email_verified_at IS NOT NULL' : 'u.email_verified_at IS NULL');
  }
  values.push(500);
  const result = await pool.query(
    `SELECT u.id, u.full_name AS "fullName", u.email,
            u.email_verified_at AS "emailVerifiedAt", u.created_at AS "createdAt",
            COUNT(DISTINCT o.id)::int AS "orderCount",
            COALESCE(SUM(o.total_paise), 0)::text AS "totalOrderPaise",
            MAX(o.created_at) AS "lastOrderAt",
            COALESCE((
              SELECT json_agg(json_build_object(
                'orderNumber', recent.order_number,
                'status', recent.status,
                'paymentStatus', recent.payment_status,
                'totalPaise', recent.total_paise,
                'createdAt', recent.created_at
              ) ORDER BY recent.created_at DESC)
              FROM (
                SELECT order_number, status, payment_status, total_paise, created_at
                FROM orders WHERE user_id = u.id
                ORDER BY created_at DESC LIMIT 10
              ) recent
            ), '[]'::json) AS "recentOrders"
     FROM users u LEFT JOIN orders o ON o.user_id = u.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${values.length}`,
    values,
  );
  res.json({ customers: result.rows });
}));

app.get('/api/admin/products', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.slug, p.name, p.description, p.category, p.ingredients,
            p.storage_instructions AS "storageInstructions", p.active,
            (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS "imageUrl",
            COALESCE(json_agg(json_build_object(
              'id', v.id, 'sku', v.sku, 'packSize', v.pack_size, 'pricePaise', v.price_paise,
              'stockQuantity', v.stock_quantity, 'lowStockThreshold', v.low_stock_threshold, 'active', v.active
            ) ORDER BY v.pack_size) FILTER (WHERE v.id IS NOT NULL), '[]'::json) AS variants
     FROM products p LEFT JOIN product_variants v ON v.product_id = p.id
     GROUP BY p.id ORDER BY p.created_at DESC LIMIT 200`,
  );
  res.json({ products: result.rows });
}));

app.patch('/api/admin/variants/:id/inventory', requireAdmin, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    stockQuantity: z.number().int().min(0).max(1_000_000),
    reason: z.string().trim().min(3).max(200),
  }), req.body);
  const variantId = uuidParam(req, 'id');
  const variant = await inTransaction(async (client) => {
    const before = await client.query(
      `SELECT v.id, v.stock_quantity, v.low_stock_threshold, v.pack_size, p.name
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = $1 FOR UPDATE OF v`,
      [variantId],
    );
    if (!before.rowCount) throw new HttpError(404, 'Product option not found.', 'NOT_FOUND');
    const current = before.rows[0];
    const change = data.stockQuantity - current.stock_quantity;
    if (change) {
      await client.query(
        'UPDATE product_variants SET stock_quantity = $2, updated_at = NOW() WHERE id = $1',
        [current.id, data.stockQuantity],
      );
      await client.query(
        `INSERT INTO inventory_movements (variant_id, admin_user_id, quantity_change, reason)
         VALUES ($1, $2, $3, $4)`,
        [current.id, req.user.id, change, data.reason],
      );
      if (current.stock_quantity === 0 && data.stockQuantity > 0) {
        await notifyRestockSubscribers(client, current.id, current.name, current.pack_size);
      }
      if (current.stock_quantity > current.low_stock_threshold
          && data.stockQuantity <= current.low_stock_threshold) {
        await notifyAdmins(
          client,
          'Product stock is low',
          `${current.name} (${current.pack_size}) has ${data.stockQuantity} units remaining.`,
        );
      }
      await client.query(
        `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'inventory_adjusted', 'variant', $2, $3::jsonb)`,
        [req.user.id, current.id, JSON.stringify({ from: current.stock_quantity, to: data.stockQuantity, reason: data.reason })],
      );
    }
    return { id: current.id, stockQuantity: data.stockQuantity, availability: stockAvailability(data.stockQuantity, current.low_stock_threshold) };
  });
  res.json({ variant });
}));

app.patch('/api/admin/orders/:id/status', requireAdmin, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    status: z.enum(['confirmed', 'preparing', 'ready_for_dispatch', 'shipped', 'out_for_delivery', 'delivered', 'rejected', 'cancelled']),
    note: z.string().trim().max(500).optional().default(''),
  }), req.body);
  const orderId = uuidParam(req, 'id');
  await inTransaction(async (client) => {
    const result = await client.query(
      `SELECT o.id, o.order_number, o.user_id, o.status, u.email
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1 FOR UPDATE OF o`,
      [orderId],
    );
    if (!result.rowCount) throw new HttpError(404, 'Order not found.', 'NOT_FOUND');
    const order = result.rows[0];
    if (!canTransitionOrder(order.status, data.status)) throw new HttpError(409, `Order cannot move from ${order.status} to ${data.status}.`, 'ORDER_STATE_INVALID');
    await client.query('UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1', [order.id, data.status]);
    if (['cancelled', 'rejected'].includes(data.status)) await releaseOrderStock(client, order.id, req.user.id);
    await client.query(
      `INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, req.user.id, order.status, data.status, data.note],
    );
    const message = `Order ${order.order_number} status is now ${data.status.replaceAll('_', ' ')}.`;
    await notifyUser(client, order.user_id, 'order', 'Order status updated', message, `/orders/${order.id}`);
    await enqueueTemplate(client, order.user_id, order.email, 'order_update', {
      orderNumber: order.order_number,
      status: data.status.replaceAll('_', ' '),
    });
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'order_status_changed', 'order', $2, $3::jsonb)`,
      [req.user.id, order.id, JSON.stringify({ from: order.status, to: data.status })],
    );
  });
  res.json({ message: 'Order status updated.' });
}));

app.patch('/api/admin/orders/:id/payment', requireAdmin, asyncRoute(async (req, res) => {
  const data = parse(z.object({
    status: z.enum(['pending', 'paid', 'failed', 'refunded']),
    providerReference: z.string().trim().max(200).optional().default(''),
    note: z.string().trim().max(300).optional().default(''),
  }), req.body);
  const orderId = uuidParam(req, 'id');
  await inTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, order_number, user_id, payment_status, total_paise FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );
    if (!result.rowCount) throw new HttpError(404, 'Order not found.', 'NOT_FOUND');
    const order = result.rows[0];
    const allowed = {
      unpaid: ['pending', 'paid', 'failed'],
      pending: ['paid', 'failed', 'refunded'],
      paid: ['refunded'],
      failed: ['pending'],
      refunded: [],
    };
    if (!allowed[order.payment_status]?.includes(data.status)) {
      throw new HttpError(409, `Payment cannot move from ${order.payment_status} to ${data.status}.`, 'PAYMENT_STATE_INVALID');
    }
    const provider = data.providerReference ? 'manual' : 'admin_recorded';
    await client.query(
      `INSERT INTO payments (order_id, provider, provider_reference, status, amount_paise)
       VALUES ($1, $2, NULLIF($3, ''), $4, $5)`,
      [order.id, provider, data.providerReference, data.status, order.total_paise],
    );
    await client.query('UPDATE orders SET payment_status = $2, updated_at = NOW() WHERE id = $1', [order.id, data.status]);
    const title = data.status === 'paid' ? 'Payment confirmed' : 'Payment status updated';
    await notifyUser(client, order.user_id, 'payment', title, `Payment for ${order.order_number} is ${data.status}.`, `/orders/${order.id}`);
    const customer = await client.query('SELECT email FROM users WHERE id = $1', [order.user_id]);
    await enqueueTemplate(client, order.user_id, customer.rows[0].email, 'payment_update', {
      orderNumber: order.order_number,
      status: data.status,
    });
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'payment_status_changed', 'order', $2, $3::jsonb)`,
      [req.user.id, order.id, JSON.stringify({ to: data.status, note: data.note })],
    );
  });
  res.json({ message: 'Payment status recorded.' });
}));

app.get('/api/admin/enquiries', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, subject, message, status, created_at AS "createdAt"
     FROM enquiries ORDER BY created_at DESC LIMIT 200`,
  );
  res.json({ enquiries: result.rows });
}));

app.patch('/api/admin/enquiries/:id/status', requireAdmin, asyncRoute(async (req, res) => {
  const status = parse(z.enum(['new', 'in_progress', 'resolved']), req.body.status);
  const enquiryId = uuidParam(req, 'id');
  const result = await pool.query(
    'UPDATE enquiries SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, status',
    [enquiryId, status],
  );
  if (!result.rowCount) throw new HttpError(404, 'Enquiry not found.', 'NOT_FOUND');
  await pool.query(
    `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'enquiry_status_changed', 'enquiry', $2, $3::jsonb)`,
    [req.user.id, enquiryId, JSON.stringify({ status })],
  );
  res.json({ enquiry: result.rows[0] });
}));

app.delete('/api/admin/enquiries/:id', requireAdmin, asyncRoute(async (req, res) => {
  const enquiryId = uuidParam(req, 'id');
  await inTransaction(async (client) => {
    const result = await client.query(
      'DELETE FROM enquiries WHERE id = $1 RETURNING id',
      [enquiryId],
    );
    if (!result.rowCount) throw new HttpError(404, 'Enquiry not found.', 'NOT_FOUND');
    await client.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'enquiry_deleted', 'enquiry', $2, '{}'::jsonb)`,
      [req.user.id, enquiryId],
    );
  });
  res.status(204).end();
}));

app.get('/api/admin/email-jobs', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT id, recipient, template, status, attempts, last_error AS "lastError",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM email_jobs ORDER BY created_at DESC LIMIT 100`,
  );
  res.json({ emailJobs: result.rows });
}));

app.get('/api/admin/audit', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT action, entity_type AS "entityType", entity_id AS "entityId",
            created_at AS "createdAt"
     FROM audit_logs ORDER BY created_at DESC LIMIT 100`,
  );
  res.json({ events: result.rows });
}));

app.get('/api/admin/email-jobs/:id/attempts', requireAdmin, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT attempt_number AS "attemptNumber", status, provider_reference AS "providerReference",
            error_message AS "errorMessage", created_at AS "createdAt"
     FROM email_delivery_attempts WHERE email_job_id = $1 ORDER BY attempt_number DESC LIMIT 20`,
    [uuidParam(req, 'id')],
  );
  res.json({ attempts: result.rows });
}));

app.get('/api/admin/inventory/:variantId/movements', requireAdmin, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT id, quantity_change AS "quantityChange", reason, created_at AS "createdAt"
     FROM inventory_movements WHERE variant_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [uuidParam(req, 'variantId')],
  );
  res.json({ movements: result.rows });
}));

app.get('/api/admin/reviews', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.product_id AS "productId", p.name AS "productName", p.slug AS "productSlug",
            r.user_id AS "userId", r.customer_name AS "customerName", u.email AS "customerEmail",
            r.rating, r.title, r.comment, r.is_approved AS "isApproved", r.created_at AS "createdAt"
     FROM product_reviews r
     JOIN products p ON p.id = r.product_id
     LEFT JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC LIMIT 200`,
  );
  res.json({ reviews: result.rows });
}));

app.patch('/api/admin/reviews/:id/status', requireAdmin, asyncRoute(async (req, res) => {
  const isApproved = parse(z.boolean(), req.body.isApproved);
  const reviewId = uuidParam(req, 'id');
  const result = await pool.query(
    'UPDATE product_reviews SET is_approved = $2, updated_at = NOW() WHERE id = $1 RETURNING id, is_approved',
    [reviewId, isApproved],
  );
  if (!result.rowCount) throw new HttpError(404, 'Review not found.', 'NOT_FOUND');
  await pool.query(
    `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'review_status_changed', 'review', $2, $3::jsonb)`,
    [req.user.id, reviewId, JSON.stringify({ isApproved })],
  );
  res.json({ message: 'Review status updated.', isApproved });
}));

app.delete('/api/admin/reviews/:id', requireAdmin, asyncRoute(async (req, res) => {
  const reviewId = uuidParam(req, 'id');
  const result = await pool.query('DELETE FROM product_reviews WHERE id = $1 RETURNING id', [reviewId]);
  if (!result.rowCount) throw new HttpError(404, 'Review not found.', 'NOT_FOUND');
  await pool.query(
    `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'review_deleted', 'review', $2, '{}'::jsonb)`,
    [req.user.id, reviewId],
  );
  res.status(204).end();
}));

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'API endpoint not found.', 'NOT_FOUND')));

app.get('/sitemap.xml', asyncRoute(async (_req, res) => {
  const products = await pool.query('SELECT slug, updated_at FROM products WHERE active = TRUE ORDER BY slug');
  const paths = ['/', '/shop', '/about', '/millets', '/recipes', '/contact', '/faq', '/shipping', '/refunds', '/privacy', '/terms'];
  const entries = [
    ...paths.map((route) => `<url><loc>${config.baseUrl}${route}</loc></url>`),
    ...products.rows.map((product) => `<url><loc>${config.baseUrl}/product/${encodeURIComponent(product.slug)}</loc><lastmod>${new Date(product.updated_at).toISOString().slice(0, 10)}</lastmod></url>`),
  ];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`);
}));

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /profile',
    'Disallow: /addresses',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /orders',
    'Disallow: /notifications',
    'Disallow: /admin',
    `Sitemap: ${config.baseUrl}/sitemap.xml`,
  ].join('\n'));
});

app.use(express.static(publicDir, {
  index: false,
  maxAge: config.isProduction ? '1h' : 0,
}));

const pageRoutes = new Set([
  '/', '/shop', '/product', '/about', '/millets', '/recipes', '/contact', '/faq',
  '/shipping', '/refunds', '/privacy', '/terms', '/signup', '/login', '/verify',
  '/forgot-password', '/reset-password', '/account', '/profile', '/addresses', '/cart',
  '/checkout', '/orders', '/notifications', '/admin', '/admin/products', '/admin/manage-products', '/admin/orders',
  '/admin/reviews', '/admin/enquiries', '/admin/customers',
]);
const publicPageMeta = {
  '/': ['BR Millet Choice | Millet powder', 'Explore millet powder products from BR Millet Choice.'],
  '/shop': ['Shop | BR Millet Choice', 'Browse BR Millet Choice millet powder products and available pack sizes.'],
  '/about': ['About | BR Millet Choice', 'Learn about BR Millet Choice. Business details are published as supplied by the owner.'],
  '/millets': ['Millets | BR Millet Choice', 'Millet information from BR Millet Choice. Product claims are published only when verified.'],
  '/recipes': ['Usage ideas | BR Millet Choice', 'Explore general usage ideas for millet powder.'],
  '/contact': ['Contact | BR Millet Choice', 'Contact BR Millet Choice with a product, order or general enquiry.'],
  '/faq': ['FAQs | BR Millet Choice', 'Answers about product options, order requests and customer accounts.'],
  '/shipping': ['Shipping | BR Millet Choice', 'Shipping and delivery information for BR Millet Choice order requests.'],
  '/refunds': ['Cancellation and refunds | BR Millet Choice', 'Information about cancelling an order request and discussing refunds.'],
  '/privacy': ['Privacy | BR Millet Choice', 'How BR Millet Choice handles account, delivery and enquiry data.'],
  '/terms': ['Terms | BR Millet Choice', 'Terms for browsing and submitting order requests to BR Millet Choice.'],
};
const privateRoutes = new Set([
  '/signup', '/login', '/verify', '/forgot-password', '/reset-password', '/account',
  '/profile', '/addresses', '/cart', '/checkout', '/orders', '/notifications', '/admin',
  '/admin/products', '/admin/manage-products', '/admin/orders', '/admin/reviews', '/admin/enquiries', '/admin/customers',
]);
function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

app.get('*', asyncRoute(async (req, res, next) => {
  const route = req.path;
  const isProduct = route.startsWith('/product/');
  const isOrder = route.startsWith('/orders/');
  if (!pageRoutes.has(route) && !isProduct && !isOrder) return next();
  const canonicalPath = route;
  let [title, description] = publicPageMeta[route] ?? ['BR Millet Choice', 'BR Millet Choice millet powder products.'];
  let structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.businessName,
    url: config.baseUrl,
  };
  if (config.businessEmail || config.businessPhone) {
    structuredData.contactPoint = [{
      '@type': 'ContactPoint',
      ...(config.businessEmail ? { email: config.businessEmail } : {}),
      ...(config.businessPhone ? { telephone: config.businessPhone } : {}),
      contactType: 'customer support',
    }];
  }
  if (isProduct) {
    const slug = decodeURIComponent(route.slice('/product/'.length));
    const productResult = await pool.query(
      `SELECT p.name, p.description, COALESCE(json_agg(json_build_object(
         'sku', v.sku, 'packSize', v.pack_size, 'pricePaise', v.price_paise,
         'stockQuantity', v.stock_quantity
       ) ORDER BY v.pack_size) FILTER (WHERE v.id IS NOT NULL), '[]'::json) AS variants
       FROM products p LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = TRUE
       WHERE p.slug = $1 AND p.active = TRUE GROUP BY p.id`,
      [slug],
    );
    if (!productResult.rowCount) return res.status(404).sendFile(path.join(publicDir, '404.html'));
    const product = productResult.rows[0];
    title = `${product.name} | BR Millet Choice`;
    description = product.description || `View ${product.name} product options from BR Millet Choice.`;
    const variants = product.variants;
    if (variants.length) {
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        brand: { '@type': 'Brand', name: config.businessName },
        offers: variants.map((variant) => ({
          '@type': 'Offer',
          sku: variant.sku,
          name: `${product.name} ${variant.packSize}`,
          priceCurrency: 'INR',
          price: (Number(variant.pricePaise) / 100).toFixed(2),
          availability: Number(variant.stockQuantity) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${config.baseUrl}${canonicalPath}`,
        })),
      };
    }
  }
  const robots = privateRoutes.has(route) || isOrder ? 'noindex,nofollow' : 'index,follow';
  if (req.method === 'GET' && !privateRoutes.has(route) && !isOrder) {
    try {
      await pool.query(
        `INSERT INTO site_metrics (metric_key, metric_value)
         VALUES ('public_page_views', 1)
         ON CONFLICT (metric_key) DO UPDATE
         SET metric_value = site_metrics.metric_value + 1, updated_at = NOW()`,
      );
    } catch (error) {
      console.error('Public page visit could not be recorded:', error.message);
    }
  }
  res.setHeader('X-Robots-Tag', robots);
  const canonical = `${config.baseUrl}${canonicalPath}`;
  const jsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');
  let html = await readFile(path.join(publicDir, 'index.html'), 'utf8');
  html = html
    .replace('<title>BR Millet Choice | Millet powder</title>', `<title>${escapeAttribute(title)}</title>`)
    .replace('Discover BR Millet Choice. Explore millet powder products and submit an order request for availability confirmation.', escapeAttribute(description))
    .replace('<meta name="robots" content="index,follow">', `<meta name="robots" content="${robots}">`)
    .replace('<link rel="canonical" href="/">', `<link rel="canonical" href="${escapeAttribute(canonical)}">`)
    .replace('<meta property="og:title" content="BR Millet Choice | Pure Millets, Healthy Living">', `<meta property="og:title" content="${escapeAttribute(title)}">`)
    .replace('<meta property="og:description" content="Explore pure millet powder products from BR Millet Choice. Wholesome goodness for your family.">', `<meta property="og:description" content="${escapeAttribute(description)}">`)
    .replace('<meta property="og:url" content="/">', `<meta property="og:url" content="${escapeAttribute(canonical)}">`)
    .replace('<meta name="twitter:title" content="BR Millet Choice | Pure Millets, Healthy Living">', `<meta name="twitter:title" content="${escapeAttribute(title)}">`)
    .replace('<meta name="twitter:description" content="Explore pure millet powder products from BR Millet Choice. Wholesome goodness for your family.">', `<meta name="twitter:description" content="${escapeAttribute(description)}">`)
    .replace('<script defer src="/app.js"></script>', `<script type="application/ld+json">${jsonLd}</script>\n    <script defer src="/app.js"></script>`);
  res.status(200).type('html').send(html);
}));

app.use((req, res, next) => {
  if (req.accepts('html')) return res.status(404).sendFile(path.join(publicDir, '404.html'));
  next(new HttpError(404, 'Page not found.', 'NOT_FOUND'));
});
app.use((error, req, res, _next) => {
  if (error.code === '23505') {
    return res.status(409).json({ error: 'That email, product slug, SKU, or pack option is already in use.', code: 'CONFLICT' });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body contains invalid JSON.', code: 'INVALID_JSON' });
  }
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : 'The image upload could not be processed.',
      code: error.code,
    });
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'The database is currently unreachable. If deployed on Vercel, please connect an online PostgreSQL database in your Vercel settings (Settings -> Environment Variables -> DATABASE_URL).',
      code: 'DATABASE_UNREACHABLE',
    });
  }
  const status = error.status ?? 500;
  if (status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'http_error',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      errorName: error.name,
      errorCode: error.code ?? null,
    }));
  }
  res.status(status).json({
    error: status >= 500 ? 'An unexpected error occurred. Please try again later.' : error.message,
    code: error.code ?? 'INTERNAL_ERROR',
  });
});

export default app;
