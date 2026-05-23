"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Book } from "@/lib/db/schema";
import {
  clearCoverAction,
  type UpdateBookState,
  updateBookAction,
} from "./actions";

const INITIAL_STATE: UpdateBookState = { status: "idle" };

export function EditBookForm({ book }: { book: Book }) {
  const boundAction = updateBookAction.bind(null, book.isbn);
  const [state, formAction, pending] = useActionState<
    UpdateBookState,
    FormData
  >(boundAction, INITIAL_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clearConfirming, setClearConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "ok") {
      toast.success(state.message);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleClearCover = async () => {
    if (!clearConfirming) {
      setClearConfirming(true);
      window.setTimeout(() => setClearConfirming(false), 4000);
      return;
    }
    setClearConfirming(false);
    try {
      await clearCoverAction(book.isbn);
      toast.success("표지를 비웠어요");
    } catch {
      toast.error("표지 삭제에 실패했어요");
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="flex gap-6 rounded-[16px] border border-zinc-900 bg-[#121212] p-6">
        <CoverPreview
          alt={book.title}
          previewUrl={previewUrl}
          src={book.coverImageUrl}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <span className="block font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              표지 이미지
            </span>
            <p className="mt-1 text-[12px] text-zinc-500">
              5KB ~ 4MB · JPG/PNG/WEBP/GIF. 업로드하면 기존 표지를 덮어써요.
            </p>
          </div>
          <input
            accept="image/*"
            className="w-full text-[13px] text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:font-medium file:text-[12px] file:text-zinc-100 hover:file:bg-zinc-700"
            name="cover"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          {book.coverImageUrl && (
            <button
              className={
                clearConfirming
                  ? "self-start font-bold text-[12px] text-red-400 underline underline-offset-2"
                  : "self-start text-[12px] text-zinc-500 underline-offset-2 hover:text-red-400 hover:underline"
              }
              onClick={handleClearCover}
              type="button"
            >
              {clearConfirming ? "한 번 더 누르면 삭제" : "현재 표지 삭제"}
            </button>
          )}
        </div>
      </section>

      <section className="rounded-[16px] border border-amber-500/30 bg-amber-500/5 p-6">
        <label
          className="block font-bold text-[11px] uppercase tracking-[0.2em] text-amber-300"
          htmlFor="ownerComment"
        >
          책방지기 코멘트
        </label>
        <p className="mt-1 text-[12px] text-zinc-400">
          이 책에 남기는 한마디. 손님이 책 상세 페이지에서 볼 수 있어요. 가게에
          붙여놓은 포스트잇처럼요.
        </p>
        <textarea
          className="mt-3 min-h-[100px] w-full resize-y rounded-lg border border-amber-500/20 bg-zinc-950 px-3 py-2 text-[13px] text-white outline-none transition-all focus:border-amber-400/50"
          defaultValue={book.ownerComment ?? ""}
          id="ownerComment"
          maxLength={2000}
          name="ownerComment"
          placeholder="예: 늦가을 비 오는 날 추천. 처음 손에 잡았을 때를 잊지 못합니다."
        />
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field defaultValue={book.title} label="제목" name="title" required />
        <Field defaultValue={book.author ?? ""} label="작가" name="author" />
        <Field
          defaultValue={book.publisher ?? ""}
          label="출판사"
          name="publisher"
        />
        <Field
          defaultValue={book.publishDate ?? ""}
          inputMode="numeric"
          label="발행일 (YYYYMMDD)"
          name="publishDate"
          pattern="\d{0,8}"
        />
        <Field defaultValue={book.kdc ?? ""} label="KDC" name="kdc" />
        <div className="sm:col-span-2">
          <label
            className="block font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500"
            htmlFor="description"
          >
            책 소개 (URL 또는 짧은 설명)
          </label>
          <textarea
            className="mt-2 min-h-[80px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[13px] text-white outline-none transition-all focus:border-zinc-600"
            defaultValue={book.description ?? ""}
            id="description"
            maxLength={2000}
            name="description"
          />
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 border-zinc-900 border-t pt-6">
        <p className="font-mono text-[11px] text-zinc-600">ISBN {book.isbn}</p>
        <button
          className="rounded-full bg-white px-6 py-2.5 font-bold text-[13px] text-black transition-all active:scale-95 disabled:cursor-wait disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function CoverPreview({
  src,
  previewUrl,
  alt,
}: {
  src: string | null;
  previewUrl: string | null;
  alt: string;
}) {
  if (previewUrl) {
    return (
      <Image
        alt={`${alt} (preview)`}
        className="rounded-md object-cover"
        height={168}
        src={previewUrl}
        unoptimized
        width={120}
      />
    );
  }
  if (src) {
    return (
      <Image
        alt={alt}
        className="rounded-md object-cover"
        height={168}
        src={src}
        width={120}
      />
    );
  }
  return (
    <div className="flex h-[168px] w-[120px] shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[11px] text-zinc-600">
      no cover
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  inputMode,
  pattern,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  inputMode?: "text" | "numeric";
  pattern?: string;
}) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500"
        htmlFor={id}
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        autoComplete="off"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[13px] text-white outline-none transition-all focus:border-zinc-600"
        defaultValue={defaultValue}
        id={id}
        inputMode={inputMode}
        name={name}
        pattern={pattern}
        required={required}
        type="text"
      />
    </div>
  );
}
