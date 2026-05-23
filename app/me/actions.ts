"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { updateUserNickname } from "@/lib/db/queries";

const nicknameSchema = z
  .string()
  .trim()
  .min(1, "닉네임은 1자 이상이어야 합니다")
  .max(64, "닉네임은 64자 이하여야 합니다");

export type UpdateNicknameResult =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

export async function updateNicknameAction(
  rawNickname: string
): Promise<UpdateNicknameResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "로그인이 필요합니다" };
  }

  const parsed = nicknameSchema.safeParse(rawNickname);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "올바르지 않은 닉네임입니다",
    };
  }

  const updated = await updateUserNickname({
    userId: session.user.id,
    nickname: parsed.data,
  });

  if (!updated) {
    return { ok: false, error: "업데이트에 실패했어요" };
  }

  revalidatePath("/me");
  revalidatePath("/archive");
  revalidatePath("/board");
  return { ok: true, nickname: updated.nickname ?? parsed.data };
}
