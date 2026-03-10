CREATE TABLE IF NOT EXISTS briefing_risks (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL,
  risk_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
);

CREATE INDEX idx_briefing_risks_briefing_id ON briefing_risks(briefing_id);
CREATE INDEX idx_briefing_risks_display_order ON briefing_risks(briefing_id, display_order);
