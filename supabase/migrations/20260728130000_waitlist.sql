-- Waitlist for launch notifications. RLS is enabled with deliberately NO
-- policies: anon/authenticated clients can neither read nor write. All access
-- goes through the Nitro server route using the service role key.
CREATE TABLE waitlist (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  consented_at TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
