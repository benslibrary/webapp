import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getPostgresUrl } from "./connection";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  const url = getPostgresUrl({ preferUnpooled: true });
  if (!url) {
    console.error(
      "❌ Postgres URL missing — checked BENSLIB_POSTGRES_URL_NON_POOLING, BENSLIB_DATABASE_URL_UNPOOLED, BENSLIB_POSTGRES_URL, POSTGRES_URL"
    );
    console.error(
      "   • In production: make sure the Neon integration exposes the BENSLIB_* vars to the Build step too (not just Runtime)."
    );
    console.error(
      "   • Locally: add POSTGRES_URL to .env.local, or run `pnpm build:vercel` to skip migrations entirely."
    );
    process.exit(1);
  }

  const connection = postgres(url, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
