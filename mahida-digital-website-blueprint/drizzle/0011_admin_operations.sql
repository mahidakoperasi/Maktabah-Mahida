-- Rilis 1: additive operational controls. Existing admin accounts keep full access
-- so a migration never interrupts the current Mahida workflow.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_access varchar(24) NOT NULL DEFAULT 'full'
  CHECK (admin_access IN ('full', 'content', 'media', 'admissions', 'commerce'));

CREATE TABLE IF NOT EXISTS activity_logs (
  id bigserial PRIMARY KEY,
  actor_id integer REFERENCES users(id) ON DELETE SET NULL,
  action varchar(40) NOT NULL,
  target_type varchar(60) NOT NULL,
  target_id varchar(80),
  summary varchar(500) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_target_idx ON activity_logs(target_type, target_id, created_at DESC);

-- Revision counters provide optimistic locking without changing public URLs/data.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE videos ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE navigation_items ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
