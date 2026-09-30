CREATE TABLE login_rate_limits (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 11),
  window_start timestamptz NOT NULL DEFAULT now()
);
