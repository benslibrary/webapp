import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-header";
import { requireAdmin } from "@/lib/auth-helpers";
import { SearchAddForm } from "../search-add-form";

export default function AdminBooksNewPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin("/admin/books/new");

  return (
    <>
      <AdminHeader
        active="books"
        backHref="/admin/books"
        backLabel="도서 카탈로그"
      />
      <main className="bg-black text-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="font-bold text-[24px] text-white">책 추가</h1>
          <p className="mt-2 text-[13px] text-zinc-500">
            제목 또는 작가로 국립중앙도서관에서 검색해 카탈로그에 추가하세요.
            추가한 책의 표지는 자동으로 우리 스토리지에 업로드됩니다.
          </p>
          <div className="mt-8">
            <SearchAddForm />
          </div>
        </div>
      </main>
    </>
  );
}

function Skeleton() {
  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-72 animate-pulse rounded-[16px] bg-zinc-900" />
      </div>
    </main>
  );
}
