CREATE TABLE engagement_likes (
  id serial PRIMARY KEY,
  kind varchar(20) NOT NULL CHECK (kind IN ('post','product','video','gallery')),
  entity_id integer NOT NULL CHECK (entity_id > 0),
  visitor_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX engagement_like_unique ON engagement_likes(kind, entity_id, visitor_hash);

CREATE TABLE engagement_comments (
  id serial PRIMARY KEY,
  kind varchar(20) NOT NULL CHECK (kind IN ('post','product','video','gallery')),
  entity_id integer NOT NULL CHECK (entity_id > 0),
  visitor_hash varchar(64) NOT NULL,
  author varchar(80) NOT NULL,
  body varchar(1000) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX engagement_comment_target_idx ON engagement_comments(kind, entity_id, status, created_at);
