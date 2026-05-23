/**
 * One-shot: promote a user to admin by Naver ID, email, or nickname.
 *
 *   pnpm tsx scripts/promote-admin.ts <naverId|email|nickname>
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { getPostgresUrl } from "../lib/db/connection";

config({ path: ".env.local" });

async function main() {
  const key = process.argv[2];
  if (!key) {
    throw new Error("usage: pnpm tsx scripts/promote-admin.ts <key>");
  }
  const url = getPostgresUrl();
  if (!url) {
    throw new Error("POSTGRES URL missing");
  }
  const sql = neon(url);

  const before = await sql`
    SELECT id, "naverId", email, nickname, role
    FROM "User"
    WHERE "naverId" = ${key} OR email = ${key} OR nickname = ${key}
  `;
  if (before.length === 0) {
    console.error(`✗ no user matches "${key}"`);
    process.exit(1);
  }
  if (before.length > 1) {
    console.error(`✗ ambiguous — ${before.length} users match`, before);
    process.exit(1);
  }
  console.log("before:", before[0]);

  const after = await sql`
    UPDATE "User"
    SET role = 'admin', "updatedAt" = NOW()
    WHERE id = ${before[0].id}
    RETURNING id, "naverId", email, nickname, role
  `;
  console.log("after :", after[0]);
  console.log("✓ promoted to admin");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
