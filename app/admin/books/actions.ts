"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { deleteBookByIsbn, upsertBook } from "@/lib/db/queries";
import { lookupBookByIsbn, normalizeIsbn } from "@/lib/nat-lib";

export type AddBookResult = {
  isbn: string;
  status: "added" | "updated" | "failed";
  title?: string;
  reason?: string;
};

export type AddBooksState = {
  results: AddBookResult[];
};

const ISBN_SPLIT_REGEX = /[\s,]+/;

export async function addBooksAction(
  _prev: AddBooksState,
  formData: FormData
): Promise<AddBooksState> {
  const session = await requireAdmin();

  const raw = String(formData.get("isbns") ?? "").trim();
  if (!raw) {
    return { results: [] };
  }

  const tokens = raw
    .split(ISBN_SPLIT_REGEX)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results: AddBookResult[] = [];

  for (const token of tokens) {
    const normalized = normalizeIsbn(token);
    if (!normalized) {
      results.push({
        isbn: token,
        status: "failed",
        reason: "ISBN 형식 오류 (10/13자리 숫자)",
      });
      continue;
    }

    const lookup = await lookupBookByIsbn(normalized);
    if (!lookup.ok) {
      results.push({
        isbn: normalized,
        status: "failed",
        reason: lookup.reason,
      });
      continue;
    }

    try {
      const { book: saved, created } = await upsertBook({
        metadata: lookup.metadata,
        addedByUserId: session.user.id,
      });
      results.push({
        isbn: saved.isbn,
        status: created ? "added" : "updated",
        title: saved.title,
      });
    } catch (_error) {
      results.push({
        isbn: normalized,
        status: "failed",
        reason: "DB 저장 실패",
      });
    }
  }

  revalidatePath("/admin/books");
  revalidatePath("/books");
  updateTag("books");
  return { results };
}

export async function deleteBookAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const isbn = String(formData.get("isbn") ?? "").trim();
  if (!isbn) {
    return;
  }
  await deleteBookByIsbn(isbn);
  revalidatePath("/admin/books");
  revalidatePath("/books");
  updateTag("books");
}
