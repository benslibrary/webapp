"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNicknameAction } from "./actions";

export function NicknameEditor({
  initialNickname,
}: {
  initialNickname: string | null | undefined;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNickname ?? "");
  const [pending, startTransition] = useTransition();

  const display = initialNickname || "닉네임 미설정";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateNicknameAction(value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await update({ nickname: result.nickname });
      router.refresh();
      toast.success("닉네임이 변경되었어요");
      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <span className="font-medium text-[12px] text-zinc-500 uppercase tracking-wider">
          닉네임
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[15px] text-white">{display}</span>
          <button
            className="text-[12px] text-zinc-500 underline-offset-2 hover:underline"
            onClick={() => {
              setValue(initialNickname ?? "");
              setEditing(true);
            }}
            type="button"
          >
            수정
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <span className="font-medium text-[12px] text-zinc-500 uppercase tracking-wider">
        닉네임
      </span>
      <input
        autoFocus
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-[15px] text-white outline-none transition-all focus:border-white"
        maxLength={64}
        onChange={(e) => setValue(e.target.value)}
        type="text"
        value={value}
      />
      <div className="flex justify-end gap-2 pt-1">
        <button
          className="rounded-md px-3 py-1.5 text-[12px] text-zinc-500"
          disabled={pending}
          onClick={() => setEditing(false)}
          type="button"
        >
          취소
        </button>
        <button
          className="rounded-md bg-white px-3 py-1.5 font-bold text-[12px] text-black transition-all active:scale-95 disabled:opacity-50"
          disabled={pending || value.trim().length === 0}
          type="submit"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
