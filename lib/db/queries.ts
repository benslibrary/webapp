import "server-only";

import { and, asc, between, desc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";
import { getPostgresUrl } from "./connection";
import {
  type Book,
  book,
  type Post,
  type PostKind,
  post,
  type User,
  user,
  type Visit,
  visit,
} from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(getPostgresUrl()!);
const db = drizzle(client);

export async function getUserByNaverId(naverId: string): Promise<User | null> {
  try {
    const [row] = await db
      .select()
      .from(user)
      .where(eq(user.naverId, naverId))
      .limit(1);
    return row ?? null;
  } catch (_error) {
    throw new ChatSDKError(
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
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to upsert Naver user"
    );
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
    throw new ChatSDKError("bad_request:database", "Failed to update nickname");
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
    throw new ChatSDKError("bad_request:database", "Failed to record visit");
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
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get visits for user"
    );
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
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get recent visits"
    );
  }
}

export type PostWithAuthor = Post & {
  authorNickname: string | null;
  authorProfileImage: string | null;
};

export async function listPosts({
  limit = 30,
  before,
}: {
  limit?: number;
  before?: Date;
}): Promise<PostWithAuthor[]> {
  try {
    const rows = await db
      .select({
        id: post.id,
        userId: post.userId,
        kind: post.kind,
        content: post.content,
        bookTitle: post.bookTitle,
        createdAt: post.createdAt,
        authorNickname: user.nickname,
        authorProfileImage: user.profileImage,
      })
      .from(post)
      .leftJoin(user, eq(post.userId, user.id))
      .where(before ? lt(post.createdAt, before) : undefined)
      .orderBy(desc(post.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      kind: row.kind as PostKind,
    }));
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to list posts");
  }
}

export async function createPost({
  userId,
  kind,
  content,
  bookTitle,
}: {
  userId: string;
  kind: PostKind;
  content: string;
  bookTitle?: string | null;
}): Promise<Post> {
  try {
    const [inserted] = await db
      .insert(post)
      .values({
        userId,
        kind,
        content,
        bookTitle: bookTitle ?? null,
      })
      .returning();
    return inserted;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create post");
  }
}

export async function deletePost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<boolean> {
  try {
    const deleted = await db
      .delete(post)
      .where(and(eq(post.id, postId), eq(post.userId, userId)))
      .returning({ id: post.id });
    return deleted.length > 0;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete post");
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
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get book by ISBN"
    );
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
    throw new ChatSDKError("bad_request:database", "Failed to list books");
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
    throw new ChatSDKError("bad_request:database", "Failed to upsert book");
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
    throw new ChatSDKError("bad_request:database", "Failed to delete book");
  }
}
