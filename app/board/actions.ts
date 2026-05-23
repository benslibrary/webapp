"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createPost } from "@/lib/db/queries";
import { POST_KINDS } from "@/lib/db/schema";

const createPostSchema = z.object({
  kind: z.enum(POST_KINDS),
  content: z.string().trim().min(1).max(2000),
  bookTitle: z.string().trim().max(200).optional(),
});

export type CreatePostState = {
  status: "idle" | "success" | "invalid" | "unauthorized" | "failed";
  message?: string;
};

export async function createPostAction(
  _prev: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "unauthorized", message: "로그인이 필요합니다." };
  }

  const raw = {
    kind: formData.get("kind"),
    content: formData.get("content"),
    bookTitle: formData.get("bookTitle") || undefined,
  };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "invalid",
      message: "내용을 다시 확인해주세요.",
    };
  }

  try {
    await createPost({
      userId: session.user.id,
      kind: parsed.data.kind,
      content: parsed.data.content,
      bookTitle: parsed.data.bookTitle ?? null,
    });
  } catch (_error) {
    return { status: "failed", message: "저장 중 오류가 발생했어요." };
  }

  revalidatePath("/board");
  redirect("/board");
}
