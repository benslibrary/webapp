import "server-only";

import { and, asc, between, desc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";
import {
  type Post,
  type PostKind,
  post,
  type User,
  user,
  type Visit,
  visit,
} from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
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
