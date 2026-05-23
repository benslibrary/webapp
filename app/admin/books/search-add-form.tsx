"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addBookByIsbnAction,
  type SearchBooksState,
  searchBooksAction,
} from "./actions";

const INITIAL_STATE: SearchBooksState = { status: "idle" };

export function SearchAddForm() {
  const [state, formAction, searching] = useActionState<
    SearchBooksState,
    FormData
  >(searchBooksAction, INITIAL_STATE);
  const [addedIsbns, setAddedIsbns] = useState<Set<string>>(new Set());
  const [pendingIsbn, setPendingIsbn] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleAdd = (isbn: string, title: string) => {
    const fd = new FormData();
    fd.set("isbn", isbn);
    setPendingIsbn(isbn);
    startTransition(async () => {
      const result = await addBookByIsbnAction(fd);
      setPendingIsbn(null);
      if (result.status === "added") {
        setAddedIsbns((prev) => new Set(prev).add(isbn));
        toast.success(`추가됨: ${result.title}`);
      } else if (result.status === "updated") {
        setAddedIsbns((prev) => new Set(prev).add(isbn));
        toast.success(`갱신됨: ${result.title}`);
      } else {
        toast.error(`실패 (${title}): ${result.reason}`);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label
            className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500"
            htmlFor="search-title"
          >
            제목
          </label>
          <input
            autoComplete="off"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
            id="search-title"
            name="title"
            placeholder="자유로부터의 도피"
            type="search"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500"
            htmlFor="search-author"
          >
            작가 (선택)
          </label>
          <input
            autoComplete="off"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
            id="search-author"
            name="author"
            placeholder="에리히 프롬"
            type="search"
          />
        </div>
        <button
          className="w-full rounded-[24px] bg-white py-3 font-bold text-[15px] text-black transition-all active:scale-[0.97] disabled:cursor-wait disabled:opacity-50"
          disabled={searching}
          type="submit"
        >
          {searching ? "검색 중…" : "국립중앙도서관에서 검색"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="rounded-md border border-red-900/40 bg-red-950/20 p-3 text-[12px] text-red-400">
          {state.message}
        </p>
      )}

      {state.status === "ok" && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[12px] text-zinc-500">
            “{state.query}” 검색 결과 {state.candidates.length}건
          </p>
          {state.candidates.length === 0 ? (
            <p className="rounded-md border border-zinc-900 bg-zinc-950 p-4 text-[13px] text-zinc-500">
              매치되는 책을 찾지 못했어요. 검색어를 바꿔보세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {state.candidates.map((c) => {
                const inCatalog = c.alreadyInCatalog || addedIsbns.has(c.isbn);
                const isPending = pendingIsbn === c.isbn;
                return (
                  <li
                    className="flex gap-3 rounded-[14px] border border-zinc-900 bg-[#121212] p-3"
                    key={c.isbn}
                  >
                    {c.coverImageUrl ? (
                      <Image
                        alt={c.title}
                        className="h-[72px] w-[52px] rounded object-cover"
                        height={72}
                        src={c.coverImageUrl.replace(/^http:\/\//, "https://")}
                        unoptimized
                        width={52}
                      />
                    ) : (
                      <div className="flex h-[72px] w-[52px] shrink-0 items-center justify-center rounded bg-zinc-900 text-[10px] text-zinc-600">
                        no cover
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-bold text-[14px] text-white">
                        {c.title}
                      </span>
                      {c.author && (
                        <span className="truncate text-[12px] text-zinc-400">
                          {c.author}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-zinc-600">
                        ISBN {c.isbn}
                      </span>
                      {c.publisher && (
                        <span className="truncate text-[11px] text-zinc-500">
                          {c.publisher}
                          {c.publishDate ? ` · ${c.publishDate}` : ""}
                        </span>
                      )}
                    </div>
                    <button
                      className={
                        inCatalog
                          ? "shrink-0 self-start rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-[11px] text-zinc-500"
                          : "shrink-0 self-start rounded-full bg-white px-3 py-1.5 font-bold text-[11px] text-black transition-all active:scale-95 disabled:cursor-wait disabled:opacity-60"
                      }
                      disabled={inCatalog || isPending}
                      onClick={() => handleAdd(c.isbn, c.title)}
                      type="button"
                    >
                      {inCatalog ? "보유" : isPending ? "추가 중…" : "추가"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
