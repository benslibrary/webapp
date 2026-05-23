"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { uploadCoverBytes } from "@/lib/cover-storage";
import {
  type BookEditableFields,
  getBookByIsbn,
  updateBookFields,
} from "@/lib/db/queries";

const editSchema = z.object({
  title: z.string().trim().min(1, "제목은 필수입니다").max(500),
  author: z.string().trim().max(500),
  publisher: z.string().trim().max(200),
  publishDate: z
    .string()
    .trim()
    .max(8)
    .regex(/^\d{0,8}$/, "발행일은 YYYYMMDD 형식의 숫자여야 합니다"),
  kdc: z.string().trim().max(16),
  description: z.string().trim().max(2000),
  ownerComment: z.string().trim().max(2000),
});

export type UpdateBookState =
  | { status: "idle" }
  | { status: "ok"; message: string; coverUploaded: boolean }
  | { status: "error"; message: string };

const MAX_COVER_BYTES = 4 * 1024 * 1024; // 4MB

function nullIfBlank(value: string): string | null {
  return value.length > 0 ? value : null;
}

export async function updateBookAction(
  isbn: string,
  _prev: UpdateBookState,
  formData: FormData
): Promise<UpdateBookState> {
  await requireAdmin(`/admin/books/${isbn}/edit`);

  const existing = await getBookByIsbn(isbn);
  if (!existing) {
    return { status: "error", message: "책을 찾을 수 없어요" };
  }

  const parsed = editSchema.safeParse({
    title: formData.get("title") ?? "",
    author: formData.get("author") ?? "",
    publisher: formData.get("publisher") ?? "",
    publishDate: formData.get("publishDate") ?? "",
    kdc: formData.get("kdc") ?? "",
    description: formData.get("description") ?? "",
    ownerComment: formData.get("ownerComment") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
    };
  }

  const fields: BookEditableFields = {
    title: parsed.data.title,
    author: nullIfBlank(parsed.data.author),
    publisher: nullIfBlank(parsed.data.publisher),
    publishDate: nullIfBlank(parsed.data.publishDate),
    kdc: nullIfBlank(parsed.data.kdc),
    description: nullIfBlank(parsed.data.description),
    ownerComment: nullIfBlank(parsed.data.ownerComment),
  };

  let coverUploaded = false;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > MAX_COVER_BYTES) {
      return {
        status: "error",
        message: `표지 이미지가 너무 커요 (최대 ${MAX_COVER_BYTES / (1024 * 1024)}MB)`,
      };
    }
    if (!cover.type.startsWith("image/")) {
      return {
        status: "error",
        message: "이미지 파일만 업로드할 수 있어요",
      };
    }
    const buffer = Buffer.from(await cover.arrayBuffer());
    const url = await uploadCoverBytes(isbn, buffer, cover.type);
    if (!url) {
      return {
        status: "error",
        message: "표지 업로드에 실패했어요 (5KB 이상의 이미지여야 해요)",
      };
    }
    fields.coverImageUrl = url;
    coverUploaded = true;
  }

  await updateBookFields({ isbn, fields });
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${isbn}/edit`);
  revalidatePath("/books");
  revalidatePath(`/books/${isbn}`);
  updateTag("books");

  return {
    status: "ok",
    message: coverUploaded ? "저장됨 · 표지 업로드 완료" : "저장됨",
    coverUploaded,
  };
}

export async function clearCoverAction(isbn: string): Promise<void> {
  await requireAdmin(`/admin/books/${isbn}/edit`);
  await updateBookFields({ isbn, fields: { coverImageUrl: null } });
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${isbn}/edit`);
  revalidatePath("/books");
  revalidatePath(`/books/${isbn}`);
  updateTag("books");
}
