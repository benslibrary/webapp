import "server-only";

import { and, asc, between, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";
import { type User, user, type Visit, visit } from "./schema";

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
