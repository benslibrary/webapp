"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type AddBooksState, addBooksAction } from "./actions";

const INITIAL_STATE: AddBooksState = { results: [] };
const ISBN_TOKEN_REGEX = /[^0-9X]/g;

export function AddBooksForm() {
  const [state, formAction, pending] = useActionState<AddBooksState, FormData>(
    addBooksAction,
    INITIAL_STATE
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textValue, setTextValue] = useState("");

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

  const handleFile = async (file: File) => {
    const text = await file.text();
    // Extract all 10/13-digit ISBN-looking sequences. Works for raw lists or
    // CSV files where the ISBN may sit next to other columns.
    const tokens = text
      .split(/[\s,;]+/)
      .map((t) => t.replace(ISBN_TOKEN_REGEX, ""))
      .filter((t) => t.length === 10 || t.length === 13);
    if (tokens.length === 0) {
      toast.error("파일에서 ISBN을 찾지 못했어요.");
      return;
    }
    const merged = [textValue, tokens.join("\n")].filter(Boolean).join("\n");
    setTextValue(merged);
    toast.success(`${tokens.length}개 ISBN을 불러왔어요. 확인 후 제출하세요.`);
    textareaRef.current?.focus();
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          ISBN 목록
        </span>
        <textarea
          className="min-h-[160px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[14px] text-white outline-none transition-all focus:border-zinc-600"
          name="isbns"
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={"9788937473272\n9788937473005\n..."}
          ref={textareaRef}
          required
          value={textValue}
        />
      </label>

      <label className="flex items-center gap-3 text-[12px] text-zinc-500">
        <span className="font-medium">CSV/TXT에서 불러오기</span>
        <input
          accept=".csv,.txt"
          className="block w-full text-[12px] text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:font-medium file:text-[12px] file:text-zinc-200"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFile(file);
              e.target.value = "";
            }
          }}
          type="file"
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
