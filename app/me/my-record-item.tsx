"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteRecordAction, updateRecordAction } from "@/app/records/actions";
import type { RecordWithRelations } from "@/lib/db/queries";

const CONFIRM_TIMEOUT_MS = 4000;

export function MyRecordItem({ record }: { record: RecordWithRelations }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateRecordAction({
        recordId: record.id,
        content: draft,
      });
      if (res.ok) {
        toast.success("수정되었어요");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDeleteClick = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("recordId", record.id);
      await deleteRecordAction(formData);
      toast.success("삭제되었어요");
      router.refresh();
    });
  };

  if (editing) {
    return (
      <li className="flex flex-col gap-3 rounded-[14px] border border-zinc-800 bg-[#121212] p-4">
        <div className="font-bold text-[14px] text-white leading-snug">
          {record.bookTitle}
        </div>
        <textarea
          className="min-h-[140px] w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[14px] text-white outline-none transition-all focus:border-zinc-600"
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
          value={draft}
        />
        <div className="flex justify-end gap-2">
          <button
            className="rounded-md px-3 py-1.5 text-[12px] text-zinc-500"
            disabled={pending}
            onClick={() => {
              setDraft(record.content);
              setEditing(false);
            }}
            type="button"
          >
            취소
          </button>
          <button
            className="rounded-md bg-white px-3 py-1.5 font-bold text-[12px] text-black transition-all active:scale-95 disabled:opacity-50"
            disabled={pending || draft.trim().length === 0}
            onClick={handleSave}
            type="button"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group flex cursor-pointer flex-col gap-1 rounded-[14px] border border-zinc-900 bg-[#121212] p-4 transition-all hover:border-zinc-800 ${
        expanded ? "border-zinc-800" : ""
      }`}
    >
      <button
        className="flex flex-col gap-1 text-left"
        onClick={() => setExpanded((v) => !v)}
        type="button"
      >
        <div className="font-bold text-[14px] text-white leading-snug">
          {record.bookTitle}
        </div>
        <p
          className={`whitespace-pre-wrap text-[13px] text-zinc-300 leading-relaxed ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {record.content}
        </p>
      </button>
      {expanded && (
        <div className="mt-2 flex justify-end gap-3 border-zinc-900 border-t pt-3 text-[12px] text-zinc-500">
          <button
            className="underline-offset-2 hover:underline"
            onClick={() => {
              setDraft(record.content);
              setEditing(true);
            }}
            type="button"
          >
            수정
          </button>
          <button
            className={
              confirmingDelete
                ? "font-bold text-red-500 underline underline-offset-2"
                : "text-red-400 underline-offset-2 hover:underline disabled:opacity-50"
            }
            disabled={pending}
            onClick={handleDeleteClick}
            type="button"
          >
            {confirmingDelete ? "정말 삭제할까요?" : "삭제"}
          </button>
        </div>
      )}
    </li>
  );
}
