/**
 * One-shot: pull every Book's cover via 국립중앙도서관, upload the
 * bytes to Vercel Blob, replace Book.coverImageUrl with the Blob URL.
 * After this runs successfully the app stops touching NL for covers.
 *
 * For each book we try, in order:
 *   1. SearchApi.do (서지 / TITLE_URL) by ISBN — what the original
 *      import used, but we re-do it so even rows with a stale URL get
 *      a fresh fetch
 *   2. The URL already stored in book.coverImageUrl, if any
 *
 * Any candidate URL is normalized to https (NL serves http→https
 * 301s) and the response must be image/* with > 5KB to count as a
 * real cover (NL serves a tiny placeholder for some entries).
 *
 * Pathname in Blob: `covers/{isbn}.{ext}` — stable, deterministic,
 * overwrite on re-run. Public access.
 *
 *   pnpm tsx scripts/backfill-covers.ts
 */

import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { getPostgresUrl } from "../lib/db/connection";
import { book } from "../lib/db/schema";
import { lookupBookByIsbn } from "../lib/nat-lib";

config({ path: ".env.local" });

const MIN_IMAGE_BYTES = 5000;
const DELAY_MS = 200;

type FetchResult =
  | { ok: true; buffer: Buffer; contentType: string; ext: string }
  | { ok: false; reason: string };

function pickExtension(contentType: string): string {
  if (contentType.includes("png")) {
    return "png";
  }
  if (contentType.includes("webp")) {
    return "webp";
  }
  if (contentType.includes("gif")) {
    return "gif";
  }
  return "jpg";
}

async function fetchAndValidate(url: string): Promise<FetchResult> {
  const normalized = url.replace(/^http:\/\//, "https://");
  let res: Response;
  try {
    res = await fetch(normalized, { redirect: "follow" });
  } catch (e) {
    return { ok: false, reason: `network: ${(e as Error).message}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `HTTP ${res.status}` };
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/")) {
    return { ok: false, reason: `non-image (${ct})` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < MIN_IMAGE_BYTES) {
    return {
      ok: false,
      reason: `placeholder (${buf.byteLength}B < ${MIN_IMAGE_BYTES}B)`,
    };
  }
  return {
    ok: true,
    buffer: buf,
    contentType: ct,
    ext: pickExtension(ct),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const url = getPostgresUrl();
  if (!url) {
    throw new Error("POSTGRES URL missing");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing");
  }
  const sql = neon(url);
  const db = drizzle(sql);

  const rows = await db
    .select({
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      coverImageUrl: book.coverImageUrl,
    })
    .from(book);

  console.log(`📚 ${rows.length} books to scan`);

  let uploaded = 0;
  let nulled = 0;
  let kept = 0;
  let alreadyBlob = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const tag = `[${(i + 1).toString().padStart(3, " ")}/${rows.length}]`;
    process.stdout.write(`${tag} ${row.title.slice(0, 30)} … `);

    // Skip if already on Blob
    if (row.coverImageUrl?.includes(".public.blob.vercel-storage.com")) {
      console.log("= already on Blob");
      alreadyBlob++;
      continue;
    }

    // Try fresh lookup first
    let candidate: string | null = null;
    const lookup = await lookupBookByIsbn(row.isbn);
    if (lookup.ok && lookup.metadata.coverImageUrl) {
      candidate = lookup.metadata.coverImageUrl;
    }
    // Fall back to whatever the DB already has
    if (!candidate && row.coverImageUrl) {
      candidate = row.coverImageUrl;
    }

    if (!candidate) {
      // Null any stale URL we still had
      if (row.coverImageUrl) {
        await db
          .update(book)
          .set({ coverImageUrl: null })
          .where(eq(book.id, row.id));
        nulled++;
        console.log("✗ no cover available → NULL");
      } else {
        console.log("- no cover (was already null)");
      }
      await delay(DELAY_MS);
      continue;
    }

    const fetched = await fetchAndValidate(candidate);
    if (!fetched.ok) {
      if (row.coverImageUrl) {
        await db
          .update(book)
          .set({ coverImageUrl: null })
          .where(eq(book.id, row.id));
        nulled++;
      }
      console.log(`✗ ${fetched.reason} → NULL`);
      await delay(DELAY_MS);
      continue;
    }

    try {
      const blob = await put(
        `covers/${row.isbn}.${fetched.ext}`,
        fetched.buffer,
        {
          access: "public",
          contentType: fetched.contentType,
          allowOverwrite: true,
          addRandomSuffix: false,
        }
      );
      await db
        .update(book)
        .set({ coverImageUrl: blob.url })
        .where(eq(book.id, row.id));
      uploaded++;
      console.log(
        `+ ${(fetched.buffer.byteLength / 1024).toFixed(0)}KB → Blob`
      );
    } catch (e) {
      kept++;
      console.log(`! Blob put failed: ${(e as Error).message}`);
    }

    await delay(DELAY_MS);
  }

  console.log("\n📊 Summary");
  console.log(`  uploaded     : ${uploaded}`);
  console.log(`  already blob : ${alreadyBlob}`);
  console.log(`  nulled       : ${nulled}`);
  console.log(`  errors       : ${kept}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
