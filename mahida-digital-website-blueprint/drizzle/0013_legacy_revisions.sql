-- Existing editorial/media routes already write this table. Additive repair
-- for installations built only from migrations; preserve any existing history.
CREATE TABLE IF NOT EXISTS revisions (
  id serial PRIMARY KEY,
  entity_type varchar(50) NOT NULL,
  entity_id integer NOT NULL,
  data jsonb NOT NULL,
  revision_note text,
  created_by integer REFERENCES users(id),
  created_at timestamp DEFAULT now()
);
