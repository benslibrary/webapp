"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { POST_KINDS, type PostKind } from "@/lib/db/schema";
import { type CreatePostState, createPostAction } from "../actions";

const INITIAL_STATE: CreatePostState = { status: "idle" };

export function NewPostForm() {
  const [state, formAction, pending] = useActionState(
    createPostAction,
    INITIAL_STATE
  );

  useEffect(() => {
    if (state.status === "invalid" || state.status === "failed") {
      toast.error(state.message ?? "오류가 발생했어요.");
    } else if (state.status === "unauthorized") {
      toast.error(state.message ?? "로그인이 필요합니다.");
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-6 px-7">
      <div>
        <span className="mb-3 block font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          종류
        </span>
        <div className="flex gap-2">
          {POST_KINDS.map((kind, i) => (
            <KindRadio defaultChecked={i === 0} key={kind} kind={kind} />
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          책 제목 (선택)
        </span>
        <input
          className="w-full border-zinc-800 border-b-2 bg-transparent py-3 text-[16px] text-white outline-none transition-all focus:border-white"
          maxLength={200}
          name="bookTitle"
          placeholder="예: 데미안 (헤르만 헤세)"
          type="text"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          내용
        </span>
        <textarea
          className="min-h-[200px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-[15px] text-white outline-none transition-all focus:border-zinc-600"
          maxLength={2000}
          name="content"
          placeholder="여기에 적어주세요…"
          required
        />
      </label>

      <button
        className="w-full rounded-[24px] bg-white py-5 font-bold text-[18px] text-black transition-all active:scale-[0.96] disabled:cursor-wait disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "저장 중…" : "올리기"}
      </button>
    </form>
  );
}

function KindRadio({
  kind,
  defaultChecked,
}: {
  kind: PostKind;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex-1">
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        name="kind"
        type="radio"
        value={kind}
      />
      <span className="block cursor-pointer rounded-full border border-zinc-800 py-3 text-center font-semibold text-[14px] text-zinc-400 transition-all peer-checked:border-white peer-checked:bg-white peer-checked:text-black">
        {kind}
      </span>
    </label>
  );
}
