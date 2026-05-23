"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { RecordWithRelations } from "@/lib/db/queries";
import { kstDateStamp } from "@/lib/geo";
import { deleteRecordAsAdminAction } from "./actions";

const CONFIRM_TIMEOUT_MS = 4000;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function formatDate(d: Date): string {
  return kstDateStamp(d).replaceAll("-", ".");
}

export function RecordsTable({ records }: { records: RecordWithRelations[] }) {
  const [query, setQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      return records;
    }
    return records.filter((r) => {
      if (r.authorNickname && normalize(r.authorNickname).includes(q)) {
        return true;
      }
      if (normalize(r.bookTitle).includes(q)) {
        return true;
      }
      if (normalize(r.content).includes(q)) {
        return true;
      }
      return false;
    });
  }, [records, query]);

  const handleDelete = (record: RecordWithRelations) => {
    if (confirmingId !== record.id) {
      setConfirmingId(record.id);
      window.setTimeout(() => {
        setConfirmingId((current) => (current === record.id ? null : current));
      }, CONFIRM_TIMEOUT_MS);
      return;
    }
    setDeletingId(record.id);
    const fd = new FormData();
    fd.set("recordId", record.id);
    startTransition(async () => {
      try {
        await deleteRecordAsAdminAction(fd);
        toast.success("기록이 삭제됐어요");
      } catch {
        toast.error("삭제 중 오류가 발생했어요");
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
          placeholder="작성자 · 책 · 내용 검색"
          type="search"
          value={query}
        />
        <span className="font-medium text-[12px] text-zinc-500">
          {filtered.length.toLocaleString()}개
          {query.trim() && ` (전체 ${records.length.toLocaleString()}개 중)`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[12px] border border-zinc-900 bg-zinc-950 p-8 text-center text-[13px] text-zinc-500">
          {records.length === 0 ? "기록이 없어요." : "검색 결과가 없어요."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((r) => {
            const confirming = confirmingId === r.id;
            const deleting = deletingId === r.id;
            return (
              <li
                className="flex flex-col gap-3 rounded-[12px] border border-zinc-900 bg-[#121212] p-4"
                key={r.id}
              >
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <div className="flex min-w-0 items-center gap-2">
                    {r.authorProfileImage ? (
                      <Image
                        alt=""
                        className="rounded-full"
                        height={20}
                        src={r.authorProfileImage}
                        width={20}
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-zinc-800" />
                    )}
                    <span className="truncate font-medium text-zinc-200">
                      {r.authorNickname || "익명"}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <Link
                      className="truncate text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                      href={`/books/${r.bookIsbn}`}
                    >
                      {r.bookTitle}
                    </Link>
                  </div>
                  <span className="shrink-0 text-zinc-600">
                    {formatDate(r.createdAt)}
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-[13px] text-zinc-200 leading-relaxed">
                  {r.content}
                </p>

                <div className="flex justify-end border-zinc-900 border-t pt-3">
                  <button
                    className={
                      confirming
                        ? "rounded-md bg-red-500/15 px-3 py-1 font-bold text-[11px] text-red-400 transition-all active:scale-95 disabled:opacity-50"
                        : "rounded-md border border-zinc-800 px-3 py-1 font-medium text-[11px] text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400 active:scale-95 disabled:opacity-50"
                    }
                    disabled={deleting}
                    onClick={() => handleDelete(r)}
                    type="button"
                  >
                    {deleting
                      ? "삭제 중…"
                      : confirming
                        ? "정말 삭제할까요?"
                        : "삭제"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
