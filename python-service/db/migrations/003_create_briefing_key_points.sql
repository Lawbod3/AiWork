CREATE TABLE IF NOT EXISTS briefing_key_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  briefing_id INTEGER NOT NULL,
  point_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
);

CREATE INDEX idx_briefing_key_points_briefing_id ON briefing_key_points(briefing_id);
CREATE INDEX idx_briefing_key_points_display_order ON briefing_key_points(briefing_id, display_order);
