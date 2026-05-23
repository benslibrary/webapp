import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-header";
import { requireAdmin } from "@/lib/auth-helpers";
import { listRecords } from "@/lib/db/queries";
import { RecordsTable } from "./records-table";

export default function AdminRecordsPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin("/admin/records");
  const records = await listRecords({ limit: 500 });

  return (
    <>
      <AdminHeader active="records" />
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-screen-2xl px-6 py-8">
          <h1 className="font-bold text-[24px] text-white">기록 관리</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            방문객이 남긴 기록을 검색하고, 부적절한 글은 삭제할 수 있어요.
            삭제하면 되돌릴 수 없어요.
          </p>
          <div className="mt-8">
            <RecordsTable records={records} />
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
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-10 w-full max-w-md animate-pulse rounded-lg bg-zinc-900" />
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => i).map((i) => (
            <div
              className="h-32 animate-pulse rounded-[12px] bg-zinc-900"
              key={i}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
