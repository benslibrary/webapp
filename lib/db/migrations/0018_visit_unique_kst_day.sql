-- DB-level guard against duplicate check-ins per KST day per user.
-- The app already filters in /api/visits, but two concurrent POSTs
-- can race past that check; this functional unique index makes the
-- second commit fail with 23505 instead of inserting a duplicate row.
--
-- We compute the KST date via INTERVAL arithmetic rather than
-- AT TIME ZONE because the latter is STABLE-not-IMMUTABLE (depends on
-- session timezone in some cases) and Postgres rejects it in an
-- index expression. KST has no DST so +9 hours is always correct.
CREATE UNIQUE INDEX IF NOT EXISTS "Visit_user_kst_day_unique"
  ON "Visit" ("userId", ((("visitedAt" + INTERVAL '9 hours')::date)));
