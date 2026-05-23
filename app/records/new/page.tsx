import Link from "next/link";
import { Suspense } from "react";
import {
  AnonymousBoardPrompt,
  NeedsCheckInPrompt,
} from "@/components/board-gate-prompt";
import { getBoardAccess } from "@/lib/auth-helpers";
import { listBooks } from "@/lib/db/queries";
import { RecordForm } from "./record-form";

export default function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>;
}) {
  const access = await getBoardAccess();
  if (access.kind === "anonymous") {
    return <AnonymousBoardPrompt callbackUrl="/records/new" />;
  }
  if (access.kind === "needsCheckIn") {
    return <NeedsCheckInPrompt />;
  }

  const { bookId: prefillBookId } = await searchParams;
  const books = await listBooks({ limit: 1000 });

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col pb-12">
        <header className="flex items-center justify-between px-7 pt-12">
          <Link
            className="font-medium text-[14px] text-zinc-500"
            href="/records"
          >
            ← 기록
          </Link>
        </header>
        <h1 className="mt-6 px-7 font-bold text-[26px] text-white">
          독서 감상 작성
        </h1>
        <p className="mt-1 px-7 text-[13px] text-zinc-500">
          어떤 책에 대한 기록인지 선택하고 감상을 적어주세요.
        </p>

        {books.length === 0 ? (
          <p className="mt-12 px-7 text-[14px] text-zinc-500">
            아직 카탈로그에 책이 없어요. 관리자가 책을 등록한 뒤 다시
            시도해주세요.
          </p>
        ) : (
          <RecordForm books={books} prefillBookId={prefillBookId} />
        )}
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12">
        <div className="h-5 w-16 animate-pulse rounded bg-zinc-900" />
        <div className="mt-6 h-8 w-48 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-60 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    </main>
  );
}
