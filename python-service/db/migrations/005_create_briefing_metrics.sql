CREATE TABLE IF NOT EXISTS briefing_metrics (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE,
  UNIQUE(briefing_id, metric_name)
);

CREATE INDEX idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
CREATE INDEX idx_briefing_metrics_display_order ON briefing_metrics(briefing_id, display_order);
