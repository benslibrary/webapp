-- Add a role column to User. Existing rows default to 'customer'.
-- The operator promotes the first admin manually:
--   UPDATE "User" SET role = 'admin' WHERE "naverId" = '<their naver id>';
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" varchar(16) NOT NULL DEFAULT 'customer';
