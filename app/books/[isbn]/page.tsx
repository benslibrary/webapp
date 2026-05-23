import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { getBookByIsbn } from "@/lib/db/queries";
import { normalizeIsbn } from "@/lib/nat-lib";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ isbn: string }>;
}) {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
      <BottomNav />
    </>
  );
}

async function Content({ params }: { params: Promise<{ isbn: string }> }) {
  await connection();
  const { isbn: raw } = await params;
  const normalized = normalizeIsbn(raw);
  if (!normalized) {
    notFound();
  }

  const book = await getBookByIsbn(normalized);
  if (!book) {
    notFound();
  }

  const formattedDate = formatPublishDate(book.publishDate);

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <Link className="text-[14px] text-zinc-500" href="/books">
          ← 도서관
        </Link>

        <header className="mt-6 flex gap-5">
          {book.coverImageUrl ? (
            <Image
              alt={book.title}
              className="rounded-lg object-cover shadow-2xl shadow-black"
              height={168}
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
            {book.publisher && (
              <p className="mt-1 text-[13px] text-zinc-500">{book.publisher}</p>
            )}
            {formattedDate && (
              <p className="mt-1 text-[12px] text-zinc-600">{formattedDate}</p>
            )}
          </div>
        </header>

        <section className="mt-8 flex flex-col gap-3 rounded-[16px] border border-zinc-900 bg-[#121212] p-5 text-[13px]">
          <Row label="ISBN" mono value={book.isbn} />
          <Divider />
          <Row label="KDC" value={book.kdc} />
          {book.description && (
            <>
              <Divider />
              <Row
                label="책 소개"
                value={
                  <a
                    className="text-blue-400 underline-offset-2 hover:underline"
                    href={book.description}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    국립중앙도서관 안내 페이지
                  </a>
                }
              />
            </>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-bold text-[18px] text-zinc-200">독자 후기</h2>
          <p className="mt-4 rounded-[16px] border border-dashed border-zinc-800 bg-zinc-950 p-6 text-center text-[13px] text-zinc-500">
            리뷰 기능은 곧 추가됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  if (!value) {
    return null;
  }
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className={
          mono
            ? "font-mono text-[13px] text-white"
            : "text-right text-[13px] text-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-zinc-900" />;
}

function formatPublishDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) {
    return null;
  }
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${year}.${month}.${day}`;
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
