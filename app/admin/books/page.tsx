import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-header";
import { BottomNav } from "@/components/bottom-nav";
import { requireAdmin } from "@/lib/auth-helpers";
import { listRecentBooks } from "@/lib/db/queries";
import { deleteBookAction } from "./actions";
import { SearchAddForm } from "./search-add-form";

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
  const recent = await listRecentBooks({ limit: 10 });

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <AdminHeader active="books" />

        <section className="mt-8">
          <h2 className="px-1 font-bold text-[15px] text-zinc-200">책 추가</h2>
          <p className="mt-1 px-1 text-[12px] text-zinc-500">
            제목 또는 작가로 국립중앙도서관에서 검색해 카탈로그에 추가하세요.
          </p>
          <div className="mt-4">
            <SearchAddForm />
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-[15px] text-zinc-200">
              최근 추가 ({recent.length})
            </h2>
            <Link
              className="text-[12px] text-zinc-500 underline-offset-2 hover:underline"
              href="/books"
            >
              전체 카탈로그 →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-[13px] text-zinc-500">
              아직 등록된 책이 없어요.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {recent.map((b) => (
                <li
                  className="flex gap-3 rounded-[14px] border border-zinc-900 bg-[#121212] p-3"
                  key={b.id}
                >
                  {b.coverImageUrl ? (
                    <Image
                      alt={b.title}
                      className="rounded object-cover"
                      height={72}
                      src={b.coverImageUrl}
                      width={52}
                    />
                  ) : (
                    <div className="flex h-[72px] w-[52px] shrink-0 items-center justify-center rounded bg-zinc-900 text-[10px] text-zinc-600">
                      no cover
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold text-[13px] text-white">
                      {b.title}
                    </span>
                    {b.author && (
                      <span className="truncate text-[11px] text-zinc-400">
                        {b.author}
                      </span>
                    )}
                    <span className="mt-1 font-mono text-[10px] text-zinc-600">
                      ISBN {b.isbn}
                    </span>
                  </div>
                  <form action={deleteBookAction} className="self-start">
                    <input name="isbn" type="hidden" value={b.isbn} />
                    <button
                      className="text-[11px] text-zinc-600 underline-offset-2 hover:underline"
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
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-40 animate-pulse rounded-[24px] bg-zinc-900" />
        <div className="mt-8 h-64 animate-pulse rounded-[24px] bg-zinc-900" />
      </div>
    </main>
  );
}
