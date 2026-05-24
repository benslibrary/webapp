import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  AnonymousBoardPrompt,
  NeedsCheckInPrompt,
} from "@/components/board-gate-prompt";
import { BottomNav } from "@/components/bottom-nav";
import { getBoardAccess } from "@/lib/auth-helpers";
import {
  cachedGetBookByIsbn,
  cachedListRecordsForBook,
} from "@/lib/cached-queries";
import { kstDateStamp } from "@/lib/geo";
import { normalizeIsbn } from "@/lib/nat-lib";

export default function BookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ isbn: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
      <BottomNav />
    </>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ isbn: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ isbn: raw }, { from }] = await Promise.all([params, searchParams]);
  const normalized = normalizeIsbn(raw);
  if (!normalized) {
    notFound();
  }

  const access = await getBoardAccess();
  if (access.kind === "anonymous") {
    return <AnonymousBoardPrompt callbackUrl={`/books/${normalized}`} />;
  }
  if (access.kind === "needsCheckIn") {
    return <NeedsCheckInPrompt />;
  }

  const book = await cachedGetBookByIsbn(normalized);
  if (!book) {
    notFound();
  }

  const records = await cachedListRecordsForBook(book.id);

  const writeHref = `/records/new?bookId=${book.id}`;
  const fromRecords = from === "records";
  const backHref = fromRecords ? "/records" : "/books";
  const backLabel = fromRecords ? "기록" : "도서관";

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <Link className="text-[14px] text-zinc-500" href={backHref}>
          ← {backLabel}
        </Link>

        <header className="mt-6 flex gap-5">
          {book.coverImageUrl ? (
            <Image
              alt={book.title}
              className="rounded-lg object-cover shadow-2xl shadow-black"
              height={168}
              priority
              src={book.coverImageUrl}
              width={120}
            />
          ) : (
            <div className="flex h-[168px] w-[120px] items-center justify-center rounded-lg bg-zinc-900 text-zinc-600 text-xs">
              no cover
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <h1 className="font-bold text-[20px] text-white leading-tight">
              {book.title}
            </h1>
            {book.author && (
              <p className="mt-2 text-[14px] text-zinc-300">{book.author}</p>
            )}
          </div>
        </header>

        {book.ownerComment && (
          <section className="mt-8 rounded-[16px] border border-amber-500/30 bg-amber-500/5 p-5">
            <span className="font-bold text-[11px] uppercase tracking-[0.2em] text-amber-300">
              책방지기
            </span>
            <p className="mt-2 whitespace-pre-wrap text-[14px] text-amber-100 leading-relaxed">
              {book.ownerComment}
            </p>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-[18px] text-zinc-200">
              기록 ({records.length})
            </h2>
            <Link
              className="rounded-full bg-white px-4 py-1.5 font-bold text-[12px] text-black transition-all active:scale-95"
              href={writeHref}
            >
              + 기록 남기기
            </Link>
          </div>

          {records.length === 0 ? (
            <p className="mt-6 rounded-[16px] border border-dashed border-zinc-800 bg-zinc-950 p-6 text-center text-[13px] text-zinc-500">
              아직 이 책에 대한 기록이 없어요.
              <br />첫 기록을 남겨보세요.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {records.map((r) => (
                <li
                  className="rounded-[14px] border border-zinc-900 bg-[#121212] p-4"
                  key={r.id}
                >
                  <p className="whitespace-pre-wrap text-[13px] text-zinc-200 leading-relaxed">
                    {r.content}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-zinc-900 border-t pt-3 text-[11px] text-zinc-600">
                    <span>— {r.authorNickname || "익명"}</span>
                    <span>
                      {kstDateStamp(r.createdAt).replaceAll("-", ".")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12">
        <div className="h-5 w-20 animate-pulse rounded bg-zinc-900" />
        <div className="mt-6 flex gap-5">
          <div className="h-[168px] w-[120px] animate-pulse rounded-lg bg-zinc-900" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-6 w-full animate-pulse rounded bg-zinc-900" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-900" />
          </div>
        </div>
      </div>
    </main>
  );
}
