import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET ?? '';
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const defaultBaseUrl = vercelDomain ? `https://${vercelDomain}` : `http://localhost:${process.env.PORT ?? 3000}`;
const baseUrl = (process.env.BASE_URL ?? defaultBaseUrl).replace(/\/+$/, '');
const smtpValues = ['SMTP_HOST', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASSWORD']
  .map((key) => process.env[key] ?? '');
const smtpPartiallyConfigured = smtpValues.some(Boolean)
  && !(process.env.SMTP_HOST && process.env.SMTP_FROM)
  || Boolean(process.env.SMTP_USER && !process.env.SMTP_PASSWORD);

if (isProduction && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
}
if (isProduction && !baseUrl.startsWith('https://')) {
  throw new Error('BASE_URL must be the canonical HTTPS origin in production.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
}
if (smtpPartiallyConfigured) {
  throw new Error('SMTP configuration is incomplete. Set SMTP_HOST and SMTP_FROM (and SMTP_PASSWORD when using SMTP_USER), or leave all SMTP settings blank.');
}

export const config = Object.freeze({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: sessionSecret || 'local-development-secret-change-before-deploy',
  trustProxy: process.env.TRUST_PROXY === '1' || Boolean(process.env.VERCEL),
  baseUrl,
  businessName: 'BR Millet Choice',
  businessEmail: process.env.BUSINESS_EMAIL ?? '',
  businessPhone: process.env.BUSINESS_PHONE ?? '',
  businessWhatsapp: process.env.BUSINESS_WHATSAPP ?? '',
  businessAddress: process.env.BUSINESS_ADDRESS ?? '',
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.SMTP_FROM ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
  ga4MeasurementId: process.env.GA4_MEASUREMENT_ID ?? '',
  paymentProvider: process.env.PAYMENT_PROVIDER ?? 'disabled',
  paymentMethods: [
    ...(process.env.ENABLE_CASH_ON_HANDOVER === 'true'
      ? [{ value: 'cash_on_handover', label: 'Cash on delivery (confirmed by the team)' }]
      : []),
    ...(process.env.ENABLE_MANUAL_TRANSFER === 'true'
      ? [{ value: 'manual_transfer', label: 'Manual transfer (instructions provided after confirmation)' }]
      : []),
  ],
});

export const emailConfigured = Boolean(config.smtpHost && config.smtpFrom);
