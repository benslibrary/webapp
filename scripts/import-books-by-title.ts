/**
 * Bulk import the bookshop's holdings into the Book table.
 *
 *   pnpm tsx scripts/import-books-by-title.ts [path/to/list.txt]
 *
 * Default input is scripts/seed-books.txt. Each non-empty, non-#
 * line should look like "제목 - 저자(카테고리)" — see the file's
 * header for the exact format. The script:
 *
 *   1. Parses each line into base title + author (strips category +
 *      `1~N` volume notation),
 *   2. Hits 국립중앙도서관 search.do (소장자료) with title+author to
 *      find a matching ISBN,
 *   3. Hits SearchApi.do with that ISBN to fetch the full book
 *      metadata (cover URL, KDC, publish date, etc.),
 *   4. Upserts into our local Book table.
 *
 * Requires the same env you'd use to run db:migrate locally:
 *   - NAT_LIB_API_KEY      (서지 + 검색 둘 다 같은 키)
 *   - BENSLIB_POSTGRES_URL or POSTGRES_URL
 */
import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { getPostgresUrl } from "../lib/db/connection";
import { book } from "../lib/db/schema";
import { lookupBookByIsbn, normalizeIsbn } from "../lib/nat-lib";

config({ path: ".env.local" });

const SEARCH_URL = "https://www.nl.go.kr/NL/search/openApi/search.do";
const DELAY_MS = 250;
const VOLUME_RANGE_REGEX = /\s+\d+\s*[~∼]\s*\d+\s*$/;
const SINGLE_VOLUME_REGEX = /\s+\d+\s*$/;
const ISBN_DIGITS_REGEX = /\d{10,13}/g;
const TITLE_AUTHOR_REGEX = /^(?<title>.+?)\s+-\s+(?<author>.+?)$/;
const CATEGORY_SUFFIX_REGEX = /\s*\(([^)]+)\)\s*$/;

type ParsedLine = { title: string; author: string; category: string | null };

type SearchHit = { isbn: string; title: string };

type ImportResult = {
  line: string;
  status: "added" | "updated" | "skipped" | "not_found" | "failed";
  reason?: string;
  title?: string;
  isbn?: string;
};

function parseLine(raw: string): ParsedLine | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }
  const match = TITLE_AUTHOR_REGEX.exec(trimmed);
  if (!match?.groups) {
    return null;
  }
  let { title, author } = match.groups;

  // pull off "(카테고리)" suffix on author
  const catMatch = CATEGORY_SUFFIX_REGEX.exec(author);
  let category: string | null = null;
  if (catMatch) {
    category = catMatch[1] ?? null;
    author = author.slice(0, catMatch.index).trim();
  }

  // strip volume notation "1~6" or trailing single volume "1" off title
  title = title
    .replace(VOLUME_RANGE_REGEX, "")
    .replace(SINGLE_VOLUME_REGEX, "")
    .trim();

  if (!title || !author) {
    return null;
  }
  return { title, author, category };
}

type SearchDoc = {
  title_info?: string;
  author_info?: string;
  isbn?: string;
  pub_info?: string;
  pub_year_info?: string;
};

type SearchResponse = {
  total?: string | number;
  result?: SearchDoc[];
  docs?: SearchDoc[];
  ERROR_CODE?: string;
  MESSAGE?: string;
};

async function searchNL(
  title: string,
  author: string
): Promise<{ ok: true; hits: SearchHit[] } | { ok: false; reason: string }> {
  const apiKey = process.env.NAT_LIB_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "NAT_LIB_API_KEY missing" };
  }
  const url = new URL(SEARCH_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("apiType", "json");
  url.searchParams.set("detailSearch", "true");
  url.searchParams.set("f1", "title");
  url.searchParams.set("v1", title);
  url.searchParams.set("f2", "author");
  url.searchParams.set("v2", author);
  url.searchParams.set("and1", "AND");
  url.searchParams.set("category", "도서");
  url.searchParams.set("pageNum", "1");
  url.searchParams.set("pageSize", "10");

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

  let body: SearchResponse;
  try {
    body = (await res.json()) as SearchResponse;
  } catch (e) {
    return { ok: false, reason: `non-JSON: ${(e as Error).message}` };
  }

  if (body.ERROR_CODE && body.ERROR_CODE !== "0") {
    return {
      ok: false,
      reason: `nl-error ${body.ERROR_CODE}: ${body.MESSAGE ?? ""}`,
    };
  }

  const docs = body.result ?? body.docs ?? [];
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const raw = (doc.isbn ?? "").toString();
    const candidates = raw.match(ISBN_DIGITS_REGEX) ?? [];
    for (const candidate of candidates) {
      const normalized = normalizeIsbn(candidate);
      if (normalized && !hits.some((h) => h.isbn === normalized)) {
        hits.push({
          isbn: normalized,
          title: (doc.title_info ?? "").trim(),
        });
      }
    }
  }

  return { ok: true, hits };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const filePath = process.argv[2] ?? "scripts/seed-books.txt";
  const url = getPostgresUrl();
  if (!url) {
    console.error(
      "BENSLIB_POSTGRES_URL or POSTGRES_URL must be set (e.g. via .env.local)"
    );
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql);

  const text = await fs.readFile(filePath, "utf8");
  const lines = text.split("\n");
  const parsed = lines
    .map((line) => ({ raw: line, parsed: parseLine(line) }))
    .filter(
      (row): row is { raw: string; parsed: ParsedLine } => row.parsed !== null
    );

  console.log(`📚 Parsed ${parsed.length} book lines from ${filePath}`);

  const results: ImportResult[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const { raw, parsed: line } = parsed[i];
    const prefix = `[${(i + 1).toString().padStart(3, " ")}/${parsed.length}]`;
    process.stdout.write(`${prefix} ${line.title} — ${line.author} … `);

    const search = await searchNL(line.title, line.author);
    if (!search.ok) {
      console.log(`✗ ${search.reason}`);
      results.push({ line: raw, status: "failed", reason: search.reason });
      await delay(DELAY_MS);
      continue;
    }
    if (search.hits.length === 0) {
      console.log("✗ no NL match");
      results.push({ line: raw, status: "not_found" });
      await delay(DELAY_MS);
      continue;
    }

    const hit = search.hits[0];

    // dedupe by ISBN before hitting SearchApi.do
    const existing = await db
      .select({ id: book.id })
      .from(book)
      .where(eq(book.isbn, hit.isbn))
      .limit(1);
    if (existing.length > 0) {
      console.log(`= skip (already in catalog) [${hit.isbn}]`);
      results.push({
        line: raw,
        status: "skipped",
        title: hit.title,
        isbn: hit.isbn,
      });
      await delay(DELAY_MS);
      continue;
    }

    await delay(DELAY_MS);
    const lookup = await lookupBookByIsbn(hit.isbn);

    if (!lookup.ok) {
      // fall back: use search.do data only (no cover, no description)
      await db
        .insert(book)
        .values({
          isbn: hit.isbn,
          title: hit.title || line.title,
          author: line.author,
          publisher: null,
          publishDate: null,
          coverImageUrl: null,
          description: null,
          kdc: null,
        })
        .onConflictDoNothing();
      console.log(`+ added [${hit.isbn}] (fallback, ${lookup.reason})`);
      results.push({
        line: raw,
        status: "added",
        title: hit.title,
        isbn: hit.isbn,
        reason: `fallback: ${lookup.reason}`,
      });
      await delay(DELAY_MS);
      continue;
    }

    await db
      .insert(book)
      .values({
        isbn: lookup.metadata.isbn,
        title: lookup.metadata.title,
        author: lookup.metadata.author,
        publisher: lookup.metadata.publisher,
        publishDate: lookup.metadata.publishDate,
        coverImageUrl: lookup.metadata.coverImageUrl,
        description: lookup.metadata.description,
        kdc: lookup.metadata.kdc,
      })
      .onConflictDoNothing();

    console.log(`+ added [${lookup.metadata.isbn}]`);
    results.push({
      line: raw,
      status: "added",
      title: lookup.metadata.title,
      isbn: lookup.metadata.isbn,
    });
    await delay(DELAY_MS);
  }

  const summary = {
    added: results.filter((r) => r.status === "added").length,
    updated: results.filter((r) => r.status === "updated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    not_found: results.filter((r) => r.status === "not_found").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
  console.log("\n📊 Summary");
  for (const [k, v] of Object.entries(summary)) {
    console.log(`   ${k.padEnd(10)}: ${v}`);
  }

  // dump misses for human review
  const missLog = "scripts/seed-books.misses.txt";
  const misses = results.filter(
    (r) => r.status === "not_found" || r.status === "failed"
  );
  if (misses.length > 0) {
    const body = misses
      .map((m) => `${m.status}\t${m.reason ?? ""}\t${m.line}`)
      .join("\n");
    await fs.writeFile(missLog, body, "utf8");
    console.log(`\n⚠️  ${misses.length} unmatched lines written to ${missLog}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("💥 fatal:", e);
  process.exit(1);
});
