CREATE TABLE IF NOT EXISTS briefings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name VARCHAR(255) NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  sector VARCHAR(255) NOT NULL,
  analyst_name VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  html_content TEXT,
  generated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_briefings_ticker ON briefings(ticker);
CREATE INDEX idx_briefings_created_at ON briefings(created_at DESC);
