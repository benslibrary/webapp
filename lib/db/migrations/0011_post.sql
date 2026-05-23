CREATE TABLE IF NOT EXISTS "Post" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "kind" varchar(16) NOT NULL,
  "content" text NOT NULL,
  "bookTitle" varchar(200),
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post" ("createdAt");
