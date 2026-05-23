-- 책방지기 (store owner) comment per book. Free-text post-it shown to
-- visitors on the book detail page; nullable since most books won't
-- have one.
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "ownerComment" text;
