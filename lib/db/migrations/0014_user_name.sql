-- Store Naver-provided 회원이름 (name) separately from nickname so it
-- can be displayed independently on /me. Required by Naver review.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "name" varchar(64);
