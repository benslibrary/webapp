import Image from "next/image";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { requireAdmin } from "@/lib/auth-helpers";
import { listBooks } from "@/lib/db/queries";
import { deleteBookAction } from "./actions";
import { AddBooksForm } from "./add-books-form";

export default function AdminBooksPage() {
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
  await requireAdmin();
  const books = await listBooks({ limit: 200 });

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <h1 className="font-bold text-[26px] text-white">
          관리자 · 도서 카탈로그
        </h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          ISBN(10 또는 13자리)을 한 줄에 하나씩 입력하세요. 국립중앙도서관에서
          서지정보를 자동으로 가져옵니다.
        </p>

        <div className="mt-8">
          <AddBooksForm />
        </div>

        <section className="mt-12">
          <h2 className="px-1 font-bold text-[18px] text-zinc-200">
            카탈로그 ({books.length}권)
          </h2>
          {books.length === 0 ? (
            <p className="mt-6 text-[14px] text-zinc-500">
              아직 등록된 책이 없어요.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {books.map((b) => (
                <li
                  className="flex gap-4 rounded-[16px] border border-zinc-900 bg-[#121212] p-4"
                  key={b.id}
                >
                  {b.coverImageUrl ? (
                    <Image
                      alt={b.title}
                      className="rounded-md object-cover"
                      height={72}
                      src={b.coverImageUrl}
                      unoptimized
                      width={52}
                    />
                  ) : (
                    <div className="flex h-[72px] w-[52px] items-center justify-center rounded-md bg-zinc-900 text-[10px] text-zinc-600">
                      no cover
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <span className="font-bold text-[14px] text-white leading-snug">
                      {b.title}
                    </span>
                    {b.author && (
                      <span className="mt-1 text-[12px] text-zinc-400">
                        {b.author}
                      </span>
                    )}
                    <span className="mt-1 font-mono text-[11px] text-zinc-600">
                      ISBN {b.isbn}
                    </span>
                  </div>
                  <form action={deleteBookAction} className="self-start">
                    <input name="isbn" type="hidden" value={b.isbn} />
                    <button
                      className="text-[12px] text-zinc-600 underline-offset-2 hover:underline"
                      type="submit"
                    >
                      삭제
                    </button>
                  </form>
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
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-40 animate-pulse rounded-[24px] bg-zinc-900" />
        <div className="mt-8 h-64 animate-pulse rounded-[24px] bg-zinc-900" />
      </div>
    </main>
  );
}
