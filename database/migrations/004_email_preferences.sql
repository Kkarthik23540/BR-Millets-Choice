ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_preferences JSONB NOT NULL
  DEFAULT '{"orderUpdates":true,"enquiryAcknowledgements":true,"backInStock":true,"promotions":false}'::jsonb;

ALTER TABLE email_jobs DROP CONSTRAINT IF EXISTS email_jobs_status_check;
ALTER TABLE email_jobs
  ADD CONSTRAINT email_jobs_status_check
  CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'suppressed'));
