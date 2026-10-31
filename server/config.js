import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const rawSessionSecret = process.env.SESSION_SECRET ?? '';
const sessionSecret = rawSessionSecret || (process.env.VERCEL ? 'brmc_vercel_default_secure_session_secret_2026_millet_choice' : '');
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'br-millets-choice.vercel.app';
const rawBaseUrl = process.env.BASE_URL ?? '';
let baseUrl;
if (process.env.VERCEL || isProduction) {
  if (!rawBaseUrl || rawBaseUrl.includes('localhost')) {
    baseUrl = `https://${vercelDomain}`;
  } else {
    baseUrl = rawBaseUrl.startsWith('https://') ? rawBaseUrl : `https://${rawBaseUrl}`;
  }
} else {
  baseUrl = rawBaseUrl || `http://localhost:${process.env.PORT ?? 3000}`;
}
baseUrl = baseUrl.replace(/\/+$/, '');
const smtpValues = ['SMTP_HOST', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASSWORD']
  .map((key) => process.env[key] ?? '');
const smtpPartiallyConfigured = smtpValues.some(Boolean)
  && !(process.env.SMTP_HOST && process.env.SMTP_FROM)
  || Boolean(process.env.SMTP_USER && !process.env.SMTP_PASSWORD);

function findDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.STORAGE_URL,
    process.env.STORAGE_POSTGRES_URL,
    process.env.STORAGE_DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.STORAGE_URL_NON_POOLING,
    process.env.STORAGE_PRISMA_URL,
    process.env.NEON_DATABASE_URL,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') return candidate;
  }

  for (const val of Object.values(process.env)) {
    if (typeof val === 'string' && (val.startsWith('postgres://') || val.startsWith('postgresql://'))) {
      return val;
    }
  }

  return '';
}

const databaseUrl = findDatabaseUrl();

if (isProduction && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
}
if (isProduction && !baseUrl.startsWith('https://')) {
  throw new Error('BASE_URL must be the canonical HTTPS origin in production.');
}
if (!databaseUrl && !process.env.VERCEL) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
}
if (smtpPartiallyConfigured) {
  throw new Error('SMTP configuration is incomplete. Set SMTP_HOST and SMTP_FROM (and SMTP_PASSWORD when using SMTP_USER), or leave all SMTP settings blank.');
}

const defaultGoogleCallbackUrl = `${baseUrl}/api/auth/google/callback`;
let resolvedGoogleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || defaultGoogleCallbackUrl;
if ((isProduction || Boolean(process.env.VERCEL)) && resolvedGoogleCallbackUrl.includes('localhost')) {
  resolvedGoogleCallbackUrl = defaultGoogleCallbackUrl;
}

export const config = Object.freeze({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  databaseUrl,
  sessionSecret: sessionSecret || 'local-development-secret-change-before-deploy',
  trustProxy: process.env.TRUST_PROXY === '1' || Boolean(process.env.VERCEL),
  baseUrl,
  businessName: 'BR Millet Choice',
  businessEmail: process.env.BUSINESS_EMAIL || 'kkarthik23540@gmail.com',
  businessPhone: process.env.BUSINESS_PHONE || '+91 7893176982',
  businessWhatsapp: process.env.BUSINESS_WHATSAPP || '+91 7893176982',
  businessAddress: process.env.BUSINESS_ADDRESS || 'Soverign Shelters , lakdi ka pul, hyderabad, Telangana 500004',
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || 'kkarthik23540@gmail.com',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.SMTP_FROM ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl: resolvedGoogleCallbackUrl,
  ga4MeasurementId: process.env.GA4_MEASUREMENT_ID ?? '',
  razorpayKeyId: '',
  paymentProvider: 'cash_on_handover',
  paymentMethods: [
    { value: 'cash_on_handover', label: 'Cash on delivery (Pay at doorstep)' },
  ],
});

export const emailConfigured = Boolean(config.smtpHost && config.smtpFrom);
