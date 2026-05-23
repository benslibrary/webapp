import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { BottomNav } from "@/components/bottom-nav";
import { listRecords } from "@/lib/db/queries";
import { kstDateStamp } from "@/lib/geo";

const LATEST_LIMIT = 30;

export default function RecordsPage() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <Content />
      </Suspense>
      <BottomNav />
    </>
  );
}

async function Content() {
  const session = await auth();
  const records = await listRecords({ limit: LATEST_LIMIT });
  const writeHref = session?.user
    ? "/records/new"
    : "/login?callbackUrl=/records/new";

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col pb-32">
        <header className="flex items-start justify-between px-7 pt-12">
          <div>
            <h1 className="font-bold text-[26px] text-white">기록</h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              방문객들이 남긴 독서 감상이에요.
            </p>
          </div>
          <Link
            aria-label="기록 작성"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-[22px] text-black leading-none transition-all active:scale-95"
            href={writeHref}
          >
            +
          </Link>
        </header>

        {records.length === 0 ? (
          <p className="mt-16 px-7 text-center text-[15px] text-zinc-500">
            아직 작성된 기록이 없어요.
            <br />첫 독서 감상을 남겨보세요.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-4 px-5">
            {records.map((r) => (
              <li
                className="flex flex-col gap-3 rounded-[16px] border border-zinc-900 bg-[#121212] p-5"
                key={r.id}
              >
                <Link
                  className="flex items-start gap-3"
                  href={`/books/${r.bookIsbn}`}
                >
                  {r.bookCoverImageUrl ? (
                    <Image
                      alt={r.bookTitle}
                      className="rounded object-cover"
                      height={56}
                      src={r.bookCoverImageUrl}
                      width={40}
                    />
                  ) : (
                    <div className="flex h-[56px] w-[40px] items-center justify-center rounded bg-zinc-900 text-[9px] text-zinc-600">
                      no cover
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <span className="font-bold text-[14px] text-white leading-snug">
                      {r.bookTitle}
                    </span>
                    {r.bookAuthor && (
                      <span className="mt-0.5 text-[12px] text-zinc-500">
                        {r.bookAuthor}
                      </span>
                    )}
                  </div>
                </Link>
                <p className="whitespace-pre-wrap break-words text-[14px] text-zinc-200 leading-relaxed">
                  {r.content}
                </p>
                <div className="flex items-center justify-between border-zinc-900 border-t pt-3 text-[11px] text-zinc-500">
                  <span>— {r.authorNickname || "익명"}</span>
                  <span>{formatDate(r.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function formatDate(d: Date): string {
  return kstDateStamp(d).replaceAll("-", ".");
}

function Skeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-5 pt-12">
        <div className="flex items-start justify-between px-2">
          <div className="h-8 w-24 animate-pulse rounded bg-zinc-900" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-900" />
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <div
              className="h-40 animate-pulse rounded-[16px] bg-zinc-900"
              key={i}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
