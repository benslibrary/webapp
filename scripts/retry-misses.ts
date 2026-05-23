/**
 * Re-attempt the books that the first import couldn't match via
 * search.do (소장자료) by hitting SearchApi.do (서지정보) with
 * title+author instead. seoji is a different NL index (CIP / 출판예정)
 * and picks up plenty of trade books the holdings catalog doesn't
 * carry verbatim. Also tries stripped variants for series.
 *
 * For each successful match: upserts the Book row and downloads the
 * cover (if any) straight to Vercel Blob, same pipeline as the
 * backfill script.
 *
 *   pnpm tsx scripts/retry-misses.ts
 */
import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { getPostgresUrl } from "../lib/db/connection";
import { book } from "../lib/db/schema";
import { lookupBookByIsbn, normalizeIsbn } from "../lib/nat-lib";

config({ path: ".env.local" });

const SEOJI_URL = "https://www.nl.go.kr/seoji/SearchApi.do";
const MIN_IMAGE_BYTES = 5000;
const DELAY_MS = 200;
const VOLUME_RANGE_REGEX = /\s+\d+\s*[~∼]\s*\d+\s*$/;
const TITLE_AUTHOR_REGEX = /^(?<title>.+?)\s+-\s+(?<author>.+?)$/;
const CATEGORY_SUFFIX_REGEX = /\s*\(([^)]+)\)\s*$/;

type ParsedLine = { title: string; author: string };

function parseMissLine(raw: string): ParsedLine | null {
  // misses file format: "status\treason\toriginal-line"
  const parts = raw.split("\t");
  const original = parts.at(-1)?.trim();
  if (!original) {
    return null;
  }
  const match = TITLE_AUTHOR_REGEX.exec(original);
  if (!match?.groups) {
    return null;
  }
  let { title, author } = match.groups;
  const catMatch = CATEGORY_SUFFIX_REGEX.exec(author);
  if (catMatch) {
    author = author.slice(0, catMatch.index).trim();
  }
  title = title.replace(VOLUME_RANGE_REGEX, "").trim();
  return { title, author };
}

type SeojiDoc = {
  EA_ISBN?: string;
  TITLE?: string;
  AUTHOR?: string;
  PUBLISHER?: string;
  PUBLISH_PREDATE?: string;
  TITLE_URL?: string;
  BOOK_INTRODUCTION_URL?: string;
  KDC?: string;
};

async function searchSeoji(
  title: string,
  author: string
): Promise<
  { ok: true; doc: SeojiDoc; isbn: string } | { ok: false; reason: string }
> {
  const apiKey = process.env.NAT_LIB_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "NAT_LIB_API_KEY missing" };
  }
  const url = new URL(SEOJI_URL);
  url.searchParams.set("cert_key", apiKey);
  url.searchParams.set("result_style", "json");
  url.searchParams.set("page_no", "1");
  url.searchParams.set("page_size", "5");
  url.searchParams.set("title", title);
  url.searchParams.set("author", author);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    return { ok: false, reason: `network: ${(e as Error).message}` };
  }
  if (!res.ok) {
    return { ok: false, reason: `HTTP ${res.status}` };
  }
  const body = (await res.json()) as { docs?: SeojiDoc[] };
  const docs = body.docs ?? [];
  for (const doc of docs) {
    const raw = (doc.EA_ISBN ?? "").trim();
    const normalized = normalizeIsbn(raw);
    if (normalized && doc.TITLE) {
      return { ok: true, doc, isbn: normalized };
    }
  }
  return { ok: false, reason: "no usable result" };
}

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
    return { ok: false, reason: `placeholder (${buf.byteLength}B)` };
  }
  return { ok: true, buffer: buf, contentType: ct, ext: pickExtension(ct) };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extras the user mentioned that weren't in the seed list at all.
const EXTRA_LINES = ["자유로부터의 도피 - 에리히 프롬"];

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

  const missText = await fs.readFile("scripts/seed-books.misses.txt", "utf8");
  const missLines = missText
    .split("\n")
    .map(parseMissLine)
    .filter((row): row is ParsedLine => row !== null);

  const extraParsed = EXTRA_LINES.map((raw) =>
    parseMissLine(`extra\t\t${raw}`)
  ).filter((row): row is ParsedLine => row !== null);

  const targets = [...missLines, ...extraParsed];
  console.log(
    `📚 ${targets.length} books to retry (${missLines.length} from misses + ${extraParsed.length} extras)`
  );

  let added = 0;
  let alreadyHave = 0;
  let stillMissed = 0;
  let coversUploaded = 0;

  for (let i = 0; i < targets.length; i++) {
    const line = targets[i];
    const tag = `[${(i + 1).toString().padStart(3, " ")}/${targets.length}]`;
    process.stdout.write(`${tag} ${line.title} — ${line.author} … `);

    const search = await searchSeoji(line.title, line.author);
    if (!search.ok) {
      console.log(`✗ ${search.reason}`);
      stillMissed++;
      await delay(DELAY_MS);
      continue;
    }
    const { isbn, doc } = search;

    // already in catalog?
    const existing = await db
      .select({ id: book.id })
      .from(book)
      .where(eq(book.isbn, isbn))
      .limit(1);
    if (existing.length > 0) {
      console.log(`= already in catalog [${isbn}]`);
      alreadyHave++;
      await delay(DELAY_MS);
      continue;
    }

    // pull full metadata via lookupBookByIsbn (same as initial import)
    const lookup = await lookupBookByIsbn(isbn);
    const title = lookup.ok
      ? lookup.metadata.title
      : (doc.TITLE ?? line.title).trim();
    const author = lookup.ok
      ? lookup.metadata.author
      : (doc.AUTHOR ?? line.author).trim() || null;

    let coverUrl: string | null = null;
    const sourceCover = lookup.ok
      ? lookup.metadata.coverImageUrl
      : (doc.TITLE_URL ?? null);
    if (sourceCover) {
      const fetched = await fetchAndValidate(sourceCover);
      if (fetched.ok) {
        try {
          const blob = await put(
            `covers/${isbn}.${fetched.ext}`,
            fetched.buffer,
            {
              access: "public",
              contentType: fetched.contentType,
              allowOverwrite: true,
              addRandomSuffix: false,
            }
          );
          coverUrl = blob.url;
          coversUploaded++;
        } catch (e) {
          // upload failed; insert without cover
          console.log(`[blob err ${(e as Error).message}] `);
        }
      }
    }

    await db.insert(book).values({
      isbn,
      title,
      author,
      publisher: lookup.ok
        ? lookup.metadata.publisher
        : (doc.PUBLISHER ?? null),
      publishDate: lookup.ok
        ? lookup.metadata.publishDate
        : (doc.PUBLISH_PREDATE ?? null),
      coverImageUrl: coverUrl,
      description: lookup.ok ? lookup.metadata.description : null,
      kdc: lookup.ok ? lookup.metadata.kdc : (doc.KDC ?? null),
    });

    console.log(`+ added [${isbn}]${coverUrl ? " + cover" : ""}`);
    added++;
    await delay(DELAY_MS);
  }

  console.log("\n📊 Summary");
  console.log(`  added         : ${added}`);
  console.log(`  already in db : ${alreadyHave}`);
  console.log(`  still missed  : ${stillMissed}`);
  console.log(`  covers uploaded: ${coversUploaded}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
