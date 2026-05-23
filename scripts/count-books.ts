import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { count } from "drizzle-orm";
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
  console.log(`Book table count: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
