"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createRecord,
  deleteOwnRecord,
  getBookByIsbn,
  updateOwnRecord,
} from "@/lib/db/queries";

const createRecordSchema = z.object({
  bookId: z.string().uuid("책을 선택해주세요"),
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요")
    .max(4000, "최대 4000자까지 입력할 수 있어요"),
});

export type CreateRecordState = {
  status: "idle" | "invalid" | "unauthorized" | "failed";
  message?: string;
};

export async function createRecordAction(
  _prev: CreateRecordState,
  formData: FormData
): Promise<CreateRecordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "unauthorized", message: "로그인이 필요합니다." };
  }

  const parsed = createRecordSchema.safeParse({
    bookId: formData.get("bookId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return {
      status: "invalid",
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
    };
  }

  try {
    await createRecord({
      userId: session.user.id,
      bookId: parsed.data.bookId,
      content: parsed.data.content,
    });
  } catch (_error) {
    return { status: "failed", message: "저장 중 오류가 발생했어요." };
  }

  revalidatePath("/records");
  revalidatePath("/me");
  updateTag("records");
  redirect("/records");
}

const updateRecordSchema = z
  .string()
  .trim()
  .min(1, "내용을 입력해주세요")
  .max(4000, "최대 4000자까지 입력할 수 있어요");

export type UpdateRecordResult = { ok: true } | { ok: false; error: string };

export async function updateRecordAction({
  recordId,
  content,
}: {
  recordId: string;
  content: string;
}): Promise<UpdateRecordResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const parsed = updateRecordSchema.safeParse(content);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
    };
  }

  const updated = await updateOwnRecord({
    recordId,
    userId: session.user.id,
    content: parsed.data,
  });

  if (!updated) {
    return { ok: false, error: "수정 권한이 없거나 글이 존재하지 않아요." };
  }

  revalidatePath("/records");
  revalidatePath("/me");
  updateTag("records");
  return { ok: true };
}

export async function deleteRecordAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const recordId = String(formData.get("recordId") ?? "").trim();
  if (!recordId) {
    return;
  }
  await deleteOwnRecord({ recordId, userId: session.user.id });
  revalidatePath("/records");
  revalidatePath("/me");
  updateTag("records");
}

// re-export for /records/new prefill validation
export async function bookExistsByIsbn(isbn: string): Promise<boolean> {
  const b = await getBookByIsbn(isbn);
  return Boolean(b);
}
