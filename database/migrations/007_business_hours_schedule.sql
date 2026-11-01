ALTER TABLE business_details
  ADD COLUMN IF NOT EXISTS open_time VARCHAR(10) DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS close_time VARCHAR(10) DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS days_open VARCHAR(100) DEFAULT 'Monday to Saturday',
  ADD COLUMN IF NOT EXISTS auto_schedule BOOLEAN DEFAULT TRUE;

UPDATE business_details
SET open_time = COALESCE(NULLIF(open_time, ''), '09:00'),
    close_time = COALESCE(NULLIF(close_time, ''), '21:00'),
    days_open = COALESCE(NULLIF(days_open, ''), 'Monday to Saturday'),
    auto_schedule = COALESCE(auto_schedule, TRUE)
WHERE id = 1;

