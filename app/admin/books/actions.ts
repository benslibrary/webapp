"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { fetchAndUploadCover } from "@/lib/cover-storage";
import {
  deleteBookByIsbn,
  findExistingIsbns,
  upsertBook,
} from "@/lib/db/queries";
import {
  type BookMetadata,
  lookupBookByIsbn,
  normalizeIsbn,
  searchBooks,
} from "@/lib/nat-lib";

export type SearchCandidate = BookMetadata & { alreadyInCatalog: boolean };

export type SearchBooksState =
  | { status: "idle" }
  | { status: "ok"; candidates: SearchCandidate[]; query: string }
  | { status: "error"; message: string };

const INITIAL_SEARCH_STATE: SearchBooksState = { status: "idle" };

function describeQuery(title: string, author: string): string {
  if (title && author) {
    return `${title} · ${author}`;
  }
  return title || author;
}

export async function searchBooksAction(
  _prev: SearchBooksState,
  formData: FormData
): Promise<SearchBooksState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();

  if (!(title || author)) {
    return INITIAL_SEARCH_STATE;
  }

  const result = await searchBooks({ title, author, limit: 12 });
  if (!result.ok) {
    return { status: "error", message: result.reason };
  }

  const existing = await findExistingIsbns(
    result.candidates.map((c) => c.isbn)
  );
  const candidates: SearchCandidate[] = result.candidates.map((c) => ({
    ...c,
    alreadyInCatalog: existing.has(c.isbn),
  }));
  return {
    status: "ok",
    candidates,
    query: describeQuery(title, author),
  };
}

export type AddBookResult =
  | { status: "added"; isbn: string; title: string }
  | { status: "updated"; isbn: string; title: string }
  | { status: "failed"; isbn: string; reason: string };

export async function addBookByIsbnAction(
  formData: FormData
): Promise<AddBookResult> {
  const session = await requireAdmin();
  const rawIsbn = String(formData.get("isbn") ?? "").trim();
  const normalized = normalizeIsbn(rawIsbn);
  if (!normalized) {
    return {
      status: "failed",
      isbn: rawIsbn,
      reason: "ISBN 형식이 올바르지 않습니다",
    };
  }

  const lookup = await lookupBookByIsbn(normalized);
  if (!lookup.ok) {
    return { status: "failed", isbn: normalized, reason: lookup.reason };
  }

  // Upload the cover to Blob so we don't leave an external URL in the row.
  const coverUrl = await fetchAndUploadCover(
    normalized,
    lookup.metadata.coverImageUrl
  );

  try {
    const { book: saved, created } = await upsertBook({
      metadata: { ...lookup.metadata, coverImageUrl: coverUrl },
      addedByUserId: session.user.id,
    });
    revalidatePath("/admin/books");
    revalidatePath("/books");
    updateTag("books");
    return {
      status: created ? "added" : "updated",
      isbn: saved.isbn,
      title: saved.title,
    };
  } catch (_error) {
    return { status: "failed", isbn: normalized, reason: "DB 저장 실패" };
  }
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
