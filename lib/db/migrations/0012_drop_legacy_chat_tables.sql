-- Drop tables left over from the Vercel Chat SDK template.
-- Safe because: schema.ts no longer references these, no application
-- code reads or writes them after PR 1/4. CASCADE handles the FK web.
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Vote_v2" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Message_v2" CASCADE;
DROP TABLE IF EXISTS "Stream" CASCADE;
DROP TABLE IF EXISTS "Suggestion" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;
