import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { count, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { getPostgresUrl } from "../lib/db/connection";
import { book } from "../lib/db/schema";

config({ path: ".env.local" });

async function main() {
  const url = getPostgresUrl();
  if (!url) {
    throw new Error("POSTGRES URL missing");
  }
  const db = drizzle(neon(url));
  const [{ total }] = await db.select({ total: count() }).from(book);
  const [{ withCover }] = await db
    .select({ withCover: count() })
    .from(book)
    .where(isNotNull(book.coverImageUrl));
  const [{ noCover }] = await db
    .select({ noCover: count() })
    .from(book)
    .where(isNull(book.coverImageUrl));
  console.log(`Total       : ${total}`);
  console.log(`With cover  : ${withCover}`);
  console.log(`No cover    : ${noCover}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
