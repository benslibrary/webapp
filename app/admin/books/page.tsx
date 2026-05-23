import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-header";
import { requireAdmin } from "@/lib/auth-helpers";
import { listBooks } from "@/lib/db/queries";
import { CatalogGrid } from "./catalog-grid";

export default function AdminBooksPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  const books = await listBooks({ limit: 2000 });

  return (
    <>
      <AdminHeader active="books" />
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-screen-2xl px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-bold text-[24px] text-white">
                도서 카탈로그
              </h1>
              <p className="mt-1 text-[13px] text-zinc-500">
                국립중앙도서관 API로 추가한 책들을 검색하고 관리하세요.
              </p>
            </div>
            <Link
              className="shrink-0 rounded-full bg-white px-5 py-2.5 font-bold text-[13px] text-black transition-all active:scale-95"
              href="/admin/books/new"
            >
              + 책 추가
            </Link>
          </div>
          <div className="mt-8">
            <CatalogGrid books={books} />
          </div>
        </div>
      </main>
    </>
  );
}

function Skeleton() {
  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-10 w-full max-w-md animate-pulse rounded-lg bg-zinc-900" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {Array.from({ length: 16 }, (_, i) => i).map((i) => (
            <div
              className="aspect-[2/3] animate-pulse rounded-[10px] bg-zinc-900"
              key={i}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
