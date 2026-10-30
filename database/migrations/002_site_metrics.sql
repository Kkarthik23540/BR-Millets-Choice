CREATE TABLE IF NOT EXISTS site_metrics (
  metric_key TEXT PRIMARY KEY,
  metric_value BIGINT NOT NULL DEFAULT 0 CHECK (metric_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_metrics (metric_key, metric_value)
VALUES ('public_page_views', 0)
ON CONFLICT (metric_key) DO NOTHING;
