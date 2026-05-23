"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Book } from "@/lib/db/schema";
import { type CreateRecordState, createRecordAction } from "../actions";

const INITIAL_STATE: CreateRecordState = { status: "idle" };
const MAX_RESULTS = 5;

export function RecordForm({
  books,
  prefillBookId,
}: {
  books: Book[];
  prefillBookId?: string;
}) {
  const [state, formAction, pending] = useActionState<
    CreateRecordState,
    FormData
  >(createRecordAction, INITIAL_STATE);

  const [selectedBookId, setSelectedBookId] = useState<string>(
    prefillBookId ?? ""
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }
    if (state.status === "unauthorized") {
      toast.error(state.message ?? "로그인이 필요합니다.");
      return;
    }
    if (state.status === "invalid" || state.status === "failed") {
      toast.error(state.message ?? "오류가 발생했어요.");
    }
  }, [state]);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) ?? null,
    [books, selectedBookId]
  );

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return books
      .filter((b) => {
        const titleHit = b.title.toLowerCase().includes(q);
        const authorHit = b.author?.toLowerCase().includes(q) ?? false;
        return titleHit || authorHit;
      })
      .slice(0, MAX_RESULTS);
  }, [books, query]);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-6 px-7">
      <input name="bookId" type="hidden" value={selectedBookId} />

      <div className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          책 선택
        </span>

        {selectedBook ? (
          <SelectedBookChip
            book={selectedBook}
            onClear={() => {
              setSelectedBookId("");
              setQuery("");
            }}
          />
        ) : (
          <>
            <input
              autoComplete="off"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="책 제목이나 작가로 검색"
              type="search"
              value={query}
            />

            {query.trim() && filteredBooks.length === 0 && (
              <p className="px-1 text-[12px] text-zinc-500">
                검색 결과가 없어요.
              </p>
            )}

            {filteredBooks.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {filteredBooks.map((b) => (
                  <li key={b.id}>
                    <button
                      className="flex w-full items-center gap-3 rounded-xl border border-zinc-900 bg-zinc-950 p-2 text-left transition-all hover:border-zinc-700"
                      onClick={() => {
                        setSelectedBookId(b.id);
                        setQuery("");
                      }}
                      type="button"
                    >
                      <BookCover book={b} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-[13px] text-white">
                          {b.title}
                        </span>
                        {b.author && (
                          <span className="truncate text-[11px] text-zinc-500">
                            {b.author}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          감상
        </span>
        <textarea
          className="min-h-[360px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
          maxLength={4000}
          name="content"
          placeholder="이 책을 읽고 어떤 생각이 드셨나요?"
          required
        />
      </label>

      <div className="flex justify-center">
        <button
          className="w-full max-w-[200px] rounded-full bg-white py-2.5 font-medium text-[14px] text-black transition-all active:scale-95 disabled:cursor-wait disabled:opacity-50"
          disabled={pending || !selectedBookId}
          type="submit"
        >
          {pending ? "저장 중…" : "올리기"}
        </button>
      </div>
    </form>
  );
}

function BookCover({ book }: { book: Book }) {
  if (book.coverImageUrl) {
    return (
      <Image
        alt={book.title}
        className="rounded object-cover"
        height={56}
        src={book.coverImageUrl}
        width={40}
      />
    );
  }
  return (
    <div className="flex h-[56px] w-[40px] shrink-0 items-center justify-center rounded bg-zinc-900 text-[9px] text-zinc-600">
      no cover
    </div>
  );
}

function SelectedBookChip({
  book,
  onClear,
}: {
  book: Book;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-[#121212] p-3">
      <BookCover book={book} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-bold text-[14px] text-white">
          {book.title}
        </span>
        {book.author && (
          <span className="truncate text-[12px] text-zinc-400">
            {book.author}
          </span>
        )}
      </div>
      <button
        className="shrink-0 px-2 text-[12px] text-zinc-500 underline-offset-2 hover:underline"
        onClick={onClear}
        type="button"
      >
        변경
      </button>
    </div>
  );
}
