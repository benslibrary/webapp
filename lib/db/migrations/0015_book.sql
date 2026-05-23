CREATE TABLE IF NOT EXISTS "Book" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "isbn" varchar(13) NOT NULL,
  "title" text NOT NULL,
  "author" text,
  "publisher" varchar(200),
  "publishDate" varchar(8),
  "coverImageUrl" text,
  "description" text,
  "kdc" varchar(16),
  "addedByUserId" uuid REFERENCES "User"("id") ON DELETE SET NULL,
  "fetchedAt" timestamp NOT NULL DEFAULT now(),
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "Book_isbn_idx" ON "Book" ("isbn");
CREATE INDEX IF NOT EXISTS "Book_title_idx" ON "Book" ("title");
