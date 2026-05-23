import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { listBooks } from "@/lib/db/queries";

export default function BooksPage() {
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
  await connection();
  const books = await listBooks({ limit: 200 });

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <h1 className="font-bold text-[26px] text-white">도서관</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          벤의 서재에서 만날 수 있는 책들이에요.
        </p>

        {books.length === 0 ? (
          <p className="mt-16 text-center text-[15px] text-zinc-500">
            아직 등록된 책이 없어요.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {books.map((b) => (
              <li key={b.id}>
                <Link
                  className="flex gap-4 rounded-[16px] border border-zinc-900 bg-[#121212] p-4 transition-all active:scale-[0.98]"
                  href={`/books/${b.isbn}`}
                >
                  {b.coverImageUrl ? (
                    <Image
                      alt={b.title}
                      className="rounded-md object-cover"
                      height={84}
                      src={b.coverImageUrl}
                      width={60}
                    />
                  ) : (
                    <div className="flex h-[84px] w-[60px] items-center justify-center rounded-md bg-zinc-900 text-[10px] text-zinc-600">
                      no cover
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <span className="font-bold text-[15px] text-white leading-snug">
                      {b.title}
                    </span>
                    {b.author && (
                      <span className="mt-1 text-[13px] text-zinc-400">
                        {b.author}
                      </span>
                    )}
                    {b.publisher && (
                      <span className="mt-1 text-[12px] text-zinc-500">
                        {b.publisher}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => i).map((i) => (
            <div
              className="h-24 animate-pulse rounded-[16px] bg-zinc-900"
              key={i}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
