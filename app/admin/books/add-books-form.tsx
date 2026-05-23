"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { type AddBooksState, addBooksAction } from "./actions";

const INITIAL_STATE: AddBooksState = { results: [] };

export function AddBooksForm() {
  const [state, formAction, pending] = useActionState<AddBooksState, FormData>(
    addBooksAction,
    INITIAL_STATE
  );

  useEffect(() => {
    if (state.results.length === 0) {
      return;
    }
    const added = state.results.filter((r) => r.status === "added").length;
    const updated = state.results.filter((r) => r.status === "updated").length;
    const failed = state.results.filter((r) => r.status === "failed").length;
    if (failed === 0) {
      toast.success(
        `${added + updated}권 처리 완료 (신규 ${added}, 갱신 ${updated})`
      );
    } else if (added + updated === 0) {
      toast.error(`${failed}권 모두 실패`);
    } else {
      toast(`${added + updated}권 성공, ${failed}권 실패`);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          ISBN 목록
        </span>
        <textarea
          className="min-h-[160px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[14px] text-white outline-none transition-all focus:border-zinc-600"
          name="isbns"
          placeholder={"9788937473272\n9788937473005\n..."}
          required
        />
      </label>

      <button
        className="w-full rounded-[24px] bg-white py-4 font-bold text-[16px] text-black transition-all active:scale-[0.97] disabled:cursor-wait disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "가져오는 중…" : "카탈로그에 추가"}
      </button>

      {state.results.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 text-[12px]">
          {state.results.map((r) => (
            <li
              className={
                r.status === "failed"
                  ? "rounded-md border border-red-900/40 bg-red-950/20 p-3"
                  : "rounded-md border border-zinc-900 bg-zinc-950 p-3"
              }
              key={r.isbn}
            >
              <span className="font-mono text-zinc-500">{r.isbn}</span>
              {" · "}
              {r.status === "failed" ? (
                <span className="text-red-400">{r.reason ?? "실패"}</span>
              ) : (
                <span className="text-zinc-300">
                  {r.status === "added" ? "신규" : "갱신"}
                  {r.title ? ` · ${r.title}` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
