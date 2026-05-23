-- Replace the freeform Post table with Record — each entry is now
-- tied to a Book via FK (operator-curated catalog only). Drop kind /
-- bookTitle free-text columns and the Post table entirely. No
-- production data on Post yet, so DROP is safe.
DROP TABLE IF EXISTS "Post" CASCADE;

CREATE TABLE IF NOT EXISTS "Record" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bookId" uuid NOT NULL REFERENCES "Book"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Record_createdAt_idx" ON "Record" ("createdAt");
CREATE INDEX IF NOT EXISTS "Record_userId_idx" ON "Record" ("userId");
CREATE INDEX IF NOT EXISTS "Record_bookId_idx" ON "Record" ("bookId");
