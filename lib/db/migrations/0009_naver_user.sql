-- Repurpose User table for Naver OAuth login
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" TYPE varchar(128);
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "naverId" varchar(64);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" varchar(64);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImage" text;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT now();
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "User_naverId_idx" ON "User" ("naverId");
