CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  sector VARCHAR(255) NOT NULL,
  analyst_name VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  html_content TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_briefings_ticker ON briefings(ticker);
CREATE INDEX idx_briefings_created_at ON briefings(created_at DESC);
