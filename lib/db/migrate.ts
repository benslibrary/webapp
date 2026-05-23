/**
 * Tiny SQL migration runner. Replaces drizzle-orm's migrator which was
 * silently skipping new entries (the hand-maintained _journal.json didn't
 * line up with the hashes recorded in __drizzle_migrations, so the matcher
 * thought every new file was already applied).
 *
 * Rules:
 *   - Files are ./lib/db/migrations/####_name.sql, sorted lexically.
 *   - Applied filenames are tracked in our own "__migrations" table.
 *   - On first run, backfill __migrations from drizzle's row count so
 *     historical migrations don't get re-applied.
 *   - Each file is executed as one transaction via sql.unsafe(), then
 *     INSERT into __migrations records the filename.
 *   - Migration SQL should be written idempotent (IF NOT EXISTS) so a
 *     re-run is safe even if a previous run partially succeeded.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import postgres from "postgres";
import { getPostgresUrl } from "./connection";

config({ path: ".env.local" });

const MIGRATIONS_DIR = "./lib/db/migrations";
const FILE_PATTERN = /^\d{4}_.*\.sql$/;

async function main() {
  const url = getPostgresUrl({ preferUnpooled: true });
  if (!url) {
    console.error(
      "❌ Postgres URL missing — set BENSLIB_POSTGRES_URL_NON_POOLING (Vercel)"
    );
    console.error(
      "   or POSTGRES_URL (.env.local), or run `pnpm build:vercel` to skip."
    );
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, prepare: false });

  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "__migrations" (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    const allFiles = await fs.readdir(MIGRATIONS_DIR);
    const files = allFiles.filter((f) => FILE_PATTERN.test(f)).sort();

    const appliedRows = await sql<
      { filename: string }[]
    >`SELECT filename FROM "__migrations"`;
    const applied = new Set(appliedRows.map((r) => r.filename));

    // First-run backfill: if drizzle's old tracking table exists and our
    // table is empty, assume the historical migrations whose count
    // matches drizzle's row count are already applied. Mark them so we
    // don't try to re-run them.
    if (applied.size === 0) {
      const drizzleRows = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM information_schema.tables
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      `;
      if ((drizzleRows[0]?.count ?? 0) > 0) {
        const drizzleApplied = await sql<{ n: number }[]>`
          SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations
        `;
        const n = drizzleApplied[0]?.n ?? 0;
        if (n > 0) {
          const backfill = files.slice(0, n);
          for (const f of backfill) {
            await sql`INSERT INTO "__migrations" (filename) VALUES (${f}) ON CONFLICT DO NOTHING`;
            applied.add(f);
          }
          console.log(`ℹ️  Backfilled __migrations from drizzle (${n} files)`);
        }
      }
    }

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log("✅ No new migrations");
      return;
    }

    console.log(`⏳ Applying ${pending.length} migration(s)…`);
    for (const f of pending) {
      const content = await fs.readFile(path.join(MIGRATIONS_DIR, f), "utf8");
      const start = Date.now();
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`INSERT INTO "__migrations" (filename) VALUES (${f})`;
      });
      console.log(`   ✓ ${f} (${Date.now() - start} ms)`);
    }
    console.log(`✅ Applied ${pending.length} migration(s)`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
