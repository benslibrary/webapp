import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, signOut } from "@/app/(auth)/auth";
import { BottomNav } from "@/components/bottom-nav";
import { getUserStats, listRecordsByUser } from "@/lib/db/queries";
import { MyRecordItem } from "./my-record-item";
import { NicknameEditor } from "./nickname-editor";

export default function MePage() {
  return (
    <>
      <Suspense fallback={<MeSkeleton />}>
        <MeContent />
      </Suspense>
      <BottomNav />
    </>
  );
}

async function MeContent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/me");
  }

  const { nickname, profileImage, role } = session.user;
  const [myRecords, stats] = await Promise.all([
    listRecordsByUser({ userId: session.user.id }),
    getUserStats({ userId: session.user.id }),
  ]);

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <header className="flex items-center justify-between">
          <h1 className="font-bold text-[26px] text-white">내 정보</h1>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              className="text-[13px] text-zinc-500 underline-offset-2 hover:underline"
              type="submit"
            >
              로그아웃
            </button>
          </form>
        </header>

        <section className="mt-8 flex items-center gap-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-6">
          {profileImage ? (
            <Image
              alt="프로필 사진"
              className="rounded-full"
              height={64}
              src={profileImage}
              width={64}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 font-bold text-2xl text-zinc-500">
              {nickname?.slice(0, 1) ?? "?"}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-[18px] text-white">
              {nickname || "닉네임 미설정"}
            </span>
            <span className="text-[12px] text-zinc-500">
              {role === "admin" ? "관리자" : "일반 회원"}
            </span>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-6">
          <NicknameEditor initialNickname={nickname} />
          <Divider />
          <StatRow label="기록한 책" value={`${stats.recordCount}권`} />
          <Divider />
          <StatRow label="방문 횟수" value={`${stats.visitCount}회`} />
        </section>

        <section className="mt-10">
          <h2 className="px-1 font-bold text-[18px] text-zinc-200">
            내 기록 ({myRecords.length})
          </h2>
          {myRecords.length === 0 ? (
            <p className="mt-4 text-[13px] text-zinc-500">
              아직 작성한 기록이 없어요.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {myRecords.map((r) => (
                <MyRecordItem key={r.id} record={r} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-[12px] text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="font-bold text-[15px] text-white">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-zinc-900" />;
}

function MeSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
        <div className="mt-8 h-24 animate-pulse rounded-[24px] bg-zinc-900" />
        <div className="mt-6 h-40 animate-pulse rounded-[24px] bg-zinc-900" />
      </div>
    </main>
  );
}
