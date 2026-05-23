CREATE TABLE IF NOT EXISTS "Visit" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "visitedAt" timestamp NOT NULL DEFAULT now(),
  "lat" double precision NOT NULL,
  "lng" double precision NOT NULL
);

CREATE INDEX IF NOT EXISTS "Visit_user_visitedAt_idx" ON "Visit" ("userId", "visitedAt");
