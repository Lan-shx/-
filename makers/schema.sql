-- Run once against the chosen PostgreSQL database before enabling model chat.
-- Contains short-lived research turns only; the public jobs snapshot is static.
CREATE TABLE IF NOT EXISTS research_turns (
  id TEXT PRIMARY KEY,
  sid TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL,
  expires BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS research_turns_expires_idx ON research_turns (expires);
