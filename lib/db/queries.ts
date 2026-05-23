import "server-only";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";
import { type User, user } from "./schema";

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
