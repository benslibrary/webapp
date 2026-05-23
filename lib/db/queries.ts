import "server-only";

import { neon } from "@neondatabase/serverless";
import {
  and,
  asc,
  between,
  desc,
  eq,
  inArray,
  lt,
  sql as sqlOp,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { AppError } from "../errors";
import { getPostgresUrl } from "./connection";
import {
  type Book,
  book,
  type Record as RecordRow,
  record,
  type User,
  user,
  type Visit,
  visit,
} from "./schema";

// Lazy connection: don't touch neon() at module load (it parses the URL
// synchronously and fetches at first query; both fail during build
// prerender when env vars aren't in scope). Build the client on first
// real query instead.
type DrizzleDb = ReturnType<typeof drizzle>;
let cachedDb: DrizzleDb | null = null;
function getDb(): DrizzleDb {
  if (cachedDb) {
    return cachedDb;
  }
  const url = getPostgresUrl();
  if (!url) {
    throw new Error(
      "Postgres URL is required at runtime — set BENSLIB_POSTGRES_URL in Vercel or POSTGRES_URL in .env.local"
    );
  }
  cachedDb = drizzle(neon(url));
  return cachedDb;
}
const db = new Proxy({} as DrizzleDb, {
  get(_target, prop: keyof DrizzleDb) {
    return getDb()[prop];
  },
});

export async function getUserByNaverId(naverId: string): Promise<User | null> {
  try {
    const [row] = await db
      .select()
      .from(user)
      .where(eq(user.naverId, naverId))
      .limit(1);
    return row ?? null;
  } catch (_error) {
    throw new AppError(
      "bad_request:database",
      "Failed to get user by Naver id"
    );
  }
}

type NaverProfile = {
  naverId: string;
  email: string | null;
  nickname: string | null;
  name: string | null;
  profileImage: string | null;
};

export async function upsertUserFromNaver(
  profile: NaverProfile
): Promise<User> {
  try {
    const existing = await getUserByNaverId(profile.naverId);

    if (existing) {
      const [updated] = await db
        .update(user)
        .set({
          email: profile.email,
          nickname: profile.nickname,
          name: profile.name,
          profileImage: profile.profileImage,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(user)
      .values({
        naverId: profile.naverId,
        email: profile.email,
        nickname: profile.nickname,
        name: profile.name,
        profileImage: profile.profileImage,
      })
      .returning();
    return inserted;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to upsert Naver user");
  }
}

export async function updateUserNickname({
  userId,
  nickname,
}: {
  userId: string;
  nickname: string;
}): Promise<User | null> {
  try {
    const [updated] = await db
      .update(user)
      .set({ nickname, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    return updated ?? null;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to update nickname");
  }
}

export async function recordVisit({
  userId,
  lat,
  lng,
}: {
  userId: string;
  lat: number;
  lng: number;
}): Promise<Visit> {
  try {
    const [inserted] = await db
      .insert(visit)
      .values({ userId, lat, lng })
      .returning();
    return inserted;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to record visit");
  }
}

export async function getVisitsForUserInRange({
  userId,
  start,
  end,
}: {
  userId: string;
  start: Date;
  end: Date;
}): Promise<Visit[]> {
  try {
    return await db
      .select()
      .from(visit)
      .where(
        and(eq(visit.userId, userId), between(visit.visitedAt, start, end))
      )
      .orderBy(asc(visit.visitedAt));
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to get visits for user");
  }
}

export async function getRecentVisitsByUser({
  userId,
  limit = 10,
}: {
  userId: string;
  limit?: number;
}): Promise<Visit[]> {
  try {
    return await db
      .select()
      .from(visit)
      .where(eq(visit.userId, userId))
      .orderBy(desc(visit.visitedAt))
      .limit(limit);
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to get recent visits");
  }
}

export async function getUserStats({
  userId,
}: {
  userId: string;
}): Promise<{ visitCount: number; recordCount: number }> {
  try {
    // Single round-trip: two correlated subqueries against a 1-row anchor
    // beats two separate HTTP fetches under neon-http (each = ~RTT to
    // Singapore).
    const rows = await db.execute(sqlOp<{
      visit_count: number;
      record_count: number;
    }>`
      SELECT
        (SELECT COUNT(*)::int FROM "Visit"  WHERE "userId" = ${userId}) AS visit_count,
        (SELECT COUNT(*)::int FROM "Record" WHERE "userId" = ${userId}) AS record_count
    `);
    const row = (
      rows as unknown as Array<{
        visit_count: number;
        record_count: number;
      }>
    )[0];
    return {
      visitCount: Number(row?.visit_count ?? 0),
      recordCount: Number(row?.record_count ?? 0),
    };
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to get user stats");
  }
}

export type RecordWithRelations = RecordRow & {
  authorNickname: string | null;
  authorProfileImage: string | null;
  bookTitle: string;
  bookAuthor: string | null;
  bookIsbn: string;
  bookCoverImageUrl: string | null;
};

const RECORD_RELATION_SELECT = {
  id: record.id,
  userId: record.userId,
  bookId: record.bookId,
  content: record.content,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  authorNickname: user.nickname,
  authorProfileImage: user.profileImage,
  bookTitle: book.title,
  bookAuthor: book.author,
  bookIsbn: book.isbn,
  bookCoverImageUrl: book.coverImageUrl,
} as const;

export async function listRecords({
  limit = 30,
  before,
}: {
  limit?: number;
  before?: Date;
} = {}): Promise<RecordWithRelations[]> {
  try {
    return await db
      .select(RECORD_RELATION_SELECT)
      .from(record)
      .innerJoin(book, eq(record.bookId, book.id))
      .leftJoin(user, eq(record.userId, user.id))
      .where(before ? lt(record.createdAt, before) : undefined)
      .orderBy(desc(record.createdAt))
      .limit(limit);
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to list records");
  }
}

export async function listRecordsByUser({
  userId,
  limit = 100,
}: {
  userId: string;
  limit?: number;
}): Promise<RecordWithRelations[]> {
  try {
    return await db
      .select(RECORD_RELATION_SELECT)
      .from(record)
      .innerJoin(book, eq(record.bookId, book.id))
      .leftJoin(user, eq(record.userId, user.id))
      .where(eq(record.userId, userId))
      .orderBy(desc(record.createdAt))
      .limit(limit);
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to list user records");
  }
}

export async function listRecordsForBook({
  bookId,
  limit = 50,
}: {
  bookId: string;
  limit?: number;
}): Promise<RecordWithRelations[]> {
  try {
    return await db
      .select(RECORD_RELATION_SELECT)
      .from(record)
      .innerJoin(book, eq(record.bookId, book.id))
      .leftJoin(user, eq(record.userId, user.id))
      .where(eq(record.bookId, bookId))
      .orderBy(desc(record.createdAt))
      .limit(limit);
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to list book records");
  }
}

export async function getOwnRecord({
  recordId,
  userId,
}: {
  recordId: string;
  userId: string;
}): Promise<RecordRow | null> {
  try {
    const [row] = await db
      .select()
      .from(record)
      .where(and(eq(record.id, recordId), eq(record.userId, userId)))
      .limit(1);
    return row ?? null;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to get record");
  }
}

export async function createRecord({
  userId,
  bookId,
  content,
}: {
  userId: string;
  bookId: string;
  content: string;
}): Promise<RecordRow> {
  try {
    const [inserted] = await db
      .insert(record)
      .values({ userId, bookId, content })
      .returning();
    return inserted;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to create record");
  }
}

export async function updateOwnRecord({
  recordId,
  userId,
  content,
}: {
  recordId: string;
  userId: string;
  content: string;
}): Promise<RecordRow | null> {
  try {
    const [updated] = await db
      .update(record)
      .set({ content, updatedAt: new Date() })
      .where(and(eq(record.id, recordId), eq(record.userId, userId)))
      .returning();
    return updated ?? null;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to update record");
  }
}

export async function deleteOwnRecord({
  recordId,
  userId,
}: {
  recordId: string;
  userId: string;
}): Promise<boolean> {
  try {
    const deleted = await db
      .delete(record)
      .where(and(eq(record.id, recordId), eq(record.userId, userId)))
      .returning({ id: record.id });
    return deleted.length > 0;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to delete record");
  }
}

export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  try {
    const [row] = await db
      .select()
      .from(book)
      .where(eq(book.isbn, isbn))
      .limit(1);
    return row ?? null;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to get book by ISBN");
  }
}

export async function listBooks({
  limit = 100,
}: {
  limit?: number;
} = {}): Promise<Book[]> {
  try {
    return await db.select().from(book).orderBy(asc(book.title)).limit(limit);
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to list books");
  }
}

export async function listRecentBooks({
  limit = 10,
}: {
  limit?: number;
} = {}): Promise<Book[]> {
  try {
    return await db
      .select()
      .from(book)
      .orderBy(desc(book.createdAt))
      .limit(limit);
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to list recent books");
  }
}

export async function findExistingIsbns(isbns: string[]): Promise<Set<string>> {
  if (isbns.length === 0) {
    return new Set();
  }
  try {
    const rows = await db
      .select({ isbn: book.isbn })
      .from(book)
      .where(inArray(book.isbn, isbns));
    return new Set(rows.map((r) => r.isbn));
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to find existing ISBNs");
  }
}

export async function deleteRecordById(recordId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(record)
      .where(eq(record.id, recordId))
      .returning({ id: record.id });
    return deleted.length > 0;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to delete record");
  }
}

export async function upsertBook({
  metadata,
  addedByUserId,
}: {
  metadata: {
    isbn: string;
    title: string;
    author: string | null;
    publisher: string | null;
    publishDate: string | null;
    coverImageUrl: string | null;
    description: string | null;
    kdc: string | null;
  };
  addedByUserId: string;
}): Promise<{ book: Book; created: boolean }> {
  try {
    const existing = await getBookByIsbn(metadata.isbn);
    if (existing) {
      const [updated] = await db
        .update(book)
        .set({
          title: metadata.title,
          author: metadata.author,
          publisher: metadata.publisher,
          publishDate: metadata.publishDate,
          coverImageUrl: metadata.coverImageUrl,
          description: metadata.description,
          kdc: metadata.kdc,
          fetchedAt: new Date(),
        })
        .where(eq(book.id, existing.id))
        .returning();
      return { book: updated, created: false };
    }
    const [inserted] = await db
      .insert(book)
      .values({
        isbn: metadata.isbn,
        title: metadata.title,
        author: metadata.author,
        publisher: metadata.publisher,
        publishDate: metadata.publishDate,
        coverImageUrl: metadata.coverImageUrl,
        description: metadata.description,
        kdc: metadata.kdc,
        addedByUserId,
      })
      .returning();
    return { book: inserted, created: true };
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to upsert book");
  }
}

export async function deleteBookByIsbn(isbn: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(book)
      .where(eq(book.isbn, isbn))
      .returning({ id: book.id });
    return deleted.length > 0;
  } catch (_error) {
    throw new AppError("bad_request:database", "Failed to delete book");
  }
}
