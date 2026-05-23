import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-header";
import { BottomNav } from "@/components/bottom-nav";
import { requireAdmin } from "@/lib/auth-helpers";
import { listRecords } from "@/lib/db/queries";
import { kstDateStamp } from "@/lib/geo";
import { deleteRecordAsAdminAction } from "./actions";

export default function AdminRecordsPage() {
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
  await requireAdmin("/admin/records");
  const records = await listRecords({ limit: 100 });

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <AdminHeader active="records" />

        <section className="mt-8">
          <h2 className="px-1 font-bold text-[15px] text-zinc-200">
            전체 기록 ({records.length})
          </h2>
          <p className="mt-1 px-1 text-[12px] text-zinc-500">
            부적절한 글은 삭제할 수 있어요. 삭제하면 되돌릴 수 없습니다.
          </p>

          {records.length === 0 ? (
            <p className="mt-6 text-[13px] text-zinc-500">
              아직 작성된 기록이 없어요.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {records.map((r) => (
                <li
                  className="rounded-[14px] border border-zinc-900 bg-[#121212] p-4"
                  key={r.id}
                >
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    {r.authorProfileImage ? (
                      <Image
                        alt=""
                        className="rounded-full"
                        height={18}
                        src={r.authorProfileImage}
                        width={18}
                      />
                    ) : (
                      <div className="h-[18px] w-[18px] rounded-full bg-zinc-800" />
                    )}
                    <span className="font-medium text-zinc-300">
                      {r.authorNickname || "익명"}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <Link
                      className="truncate text-zinc-500 underline-offset-2 hover:underline"
                      href={`/books/${r.bookIsbn}`}
                    >
                      {r.bookTitle}
                    </Link>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[13px] text-zinc-200 leading-relaxed">
                    {r.content}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-zinc-900 border-t pt-3 text-[11px]">
                    <span className="text-zinc-600">
                      {kstDateStamp(r.createdAt).replaceAll("-", ".")}
                    </span>
                    <form action={deleteRecordAsAdminAction}>
                      <input name="recordId" type="hidden" value={r.id} />
                      <button
                        className="text-red-400 underline-offset-2 hover:underline"
                        type="submit"
                      >
                        삭제
                      </button>
                    </form>
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
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-40 animate-pulse rounded-[24px] bg-zinc-900" />
        <div className="mt-4 h-40 animate-pulse rounded-[24px] bg-zinc-900" />
      </div>
    </main>
  );
}
