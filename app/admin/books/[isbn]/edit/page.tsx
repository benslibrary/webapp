import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-header";
import { requireAdmin } from "@/lib/auth-helpers";
import { getBookByIsbn } from "@/lib/db/queries";
import { normalizeIsbn } from "@/lib/nat-lib";
import { EditBookForm } from "./edit-form";

export default function EditBookPage({
  params,
}: {
  params: Promise<{ isbn: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn: raw } = await params;
  const normalized = normalizeIsbn(raw);
  if (!normalized) {
    notFound();
  }

  await requireAdmin(`/admin/books/${normalized}/edit`);

  const book = await getBookByIsbn(normalized);
  if (!book) {
    notFound();
  }

  return (
    <>
      <AdminHeader
        active="books"
        backHref="/admin/books"
        backLabel="도서 카탈로그"
      />
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="font-bold text-[24px] text-white">책 편집</h1>
          <p className="mt-1 truncate text-[13px] text-zinc-500">
            {book.title}
          </p>
          <div className="mt-8">
            <EditBookForm book={book} />
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
        <div className="mt-8 h-64 animate-pulse rounded-[16px] bg-zinc-900" />
        <div className="mt-8 h-40 animate-pulse rounded-[16px] bg-zinc-900" />
      </div>
    </main>
  );
}
