"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Book } from "@/lib/db/schema";
import { deleteBookAction } from "./actions";

const CONFIRM_TIMEOUT_MS = 4000;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function CatalogGrid({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      return books;
    }
    return books.filter((b) => {
      if (normalize(b.title).includes(q)) {
        return true;
      }
      if (b.author && normalize(b.author).includes(q)) {
        return true;
      }
      if (b.isbn.includes(q)) {
        return true;
      }
      return false;
    });
  }, [books, query]);

  const handleDelete = (book: Book) => {
    if (confirmingId !== book.id) {
      setConfirmingId(book.id);
      window.setTimeout(() => {
        setConfirmingId((current) => (current === book.id ? null : current));
      }, CONFIRM_TIMEOUT_MS);
      return;
    }
    setDeletingId(book.id);
    const fd = new FormData();
    fd.set("isbn", book.isbn);
    startTransition(async () => {
      try {
        await deleteBookAction(fd);
        toast.success(`삭제됨: ${book.title}`);
      } catch {
        toast.error("삭제 중 오류가 발생했어요.");
      } finally {
        setDeletingId(null);
        setConfirmingId(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          autoComplete="off"
          className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-[14px] text-white outline-none transition-all focus:border-zinc-600"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 · 작가 · ISBN 검색"
          type="search"
          value={query}
        />
        <span className="font-medium text-[12px] text-zinc-500">
          {filtered.length.toLocaleString()}권
          {query.trim() && ` (전체 ${books.length.toLocaleString()}권 중)`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[12px] border border-zinc-900 bg-zinc-950 p-8 text-center text-[13px] text-zinc-500">
          {books.length === 0
            ? "아직 등록된 책이 없어요."
            : "검색 결과가 없어요."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {filtered.map((b) => {
            const confirming = confirmingId === b.id;
            const deleting = deletingId === b.id;
            return (
              <li
                className="group relative flex flex-col gap-2 rounded-[10px] border border-zinc-900 bg-[#121212] p-2.5 transition-all hover:border-zinc-700"
                key={b.id}
              >
                {b.coverImageUrl ? (
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900">
                    <Image
                      alt={b.title}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 16vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                      src={b.coverImageUrl}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md bg-zinc-900 text-[10px] text-zinc-600">
                    no cover
                  </div>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="truncate font-bold text-[12px] text-white leading-snug"
                    title={b.title}
                  >
                    {b.title}
                  </span>
                  {b.author && (
                    <span
                      className="truncate text-[11px] text-zinc-500"
                      title={b.author}
                    >
                      {b.author}
                    </span>
                  )}
                  <span className="truncate font-mono text-[10px] text-zinc-600">
                    {b.isbn}
                  </span>
                </div>
                <button
                  className={
                    confirming
                      ? "mt-auto rounded-md bg-red-500/15 px-2 py-1 font-bold text-[11px] text-red-400 transition-all active:scale-95 disabled:opacity-50"
                      : "mt-auto rounded-md border border-zinc-800 px-2 py-1 font-medium text-[11px] text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400 active:scale-95 disabled:opacity-50"
                  }
                  disabled={deleting}
                  onClick={() => handleDelete(b)}
                  type="button"
                >
                  {deleting
                    ? "삭제 중…"
                    : confirming
                      ? "정말 삭제할까요?"
                      : "삭제"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
