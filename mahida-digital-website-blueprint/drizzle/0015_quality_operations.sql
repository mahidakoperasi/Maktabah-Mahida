-- Additive R5: anonymous daily counters and the latest quality/manual review.
CREATE TABLE analytics_daily (
  day date NOT NULL,
  path varchar(255) NOT NULL,
  event varchar(50) NOT NULL,
  count bigint NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY(day,path,event)
);
CREATE INDEX analytics_daily_event_day_idx ON analytics_daily(event,day);
CREATE TABLE quality_reports (
  target text NOT NULL,
  version varchar(12) NOT NULL CHECK (version IN ('draft','published')),
  snapshot_hash varchar(64) NOT NULL,
  report jsonb NOT NULL,
  checked_by integer REFERENCES users(id) ON DELETE SET NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(target,version)
);
CREATE TABLE publication_checklists (
  target text PRIMARY KEY,
  snapshot_hash varchar(64) NOT NULL,
  checks jsonb NOT NULL,
  reviewed_by integer REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO settings(key,value) VALUES('routine_analytics','{"enabled":true}')
ON CONFLICT(key) DO NOTHING;
