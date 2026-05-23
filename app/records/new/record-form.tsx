"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { Book } from "@/lib/db/schema";
import { type CreateRecordState, createRecordAction } from "../actions";

const INITIAL_STATE: CreateRecordState = { status: "idle" };

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

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-6 px-7">
      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          책 선택
        </span>
        <select
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
          defaultValue={prefillBookId ?? ""}
          name="bookId"
          required
        >
          <option disabled value="">
            -- 책을 골라주세요 --
          </option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
              {b.author ? ` · ${b.author}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          감상
        </span>
        <textarea
          className="min-h-[200px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
          maxLength={4000}
          name="content"
          placeholder="이 책을 읽고 어떤 생각이 드셨나요?"
          required
        />
      </label>

      <button
        className="w-full rounded-[24px] bg-white py-5 font-bold text-[18px] text-black transition-all active:scale-[0.97] disabled:cursor-wait disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "저장 중…" : "올리기"}
      </button>
    </form>
  );
}
