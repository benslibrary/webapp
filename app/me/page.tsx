import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, signOut } from "@/app/(auth)/auth";
import { AutoCheckIn } from "@/components/auto-check-in";
import { BottomNav } from "@/components/bottom-nav";
import {
  getUserStats,
  getVisitsForUserInRange,
  listRecordsByUser,
} from "@/lib/db/queries";
import { kstDateStamp, kstMonthBounds } from "@/lib/geo";
import { MyRecordItem } from "./my-record-item";
import { NicknameEditor } from "./nickname-editor";

const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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
  const { start, end, year, month } = kstMonthBounds();
  const [myRecords, stats, monthVisits] = await Promise.all([
    listRecordsByUser({ userId: session.user.id }),
    getUserStats({ userId: session.user.id }),
    getVisitsForUserInRange({
      userId: session.user.id,
      start,
      end,
    }),
  ]);

  const visitedDays = new Set(
    monthVisits.map((v) => Number(kstDateStamp(v.visitedAt).slice(8, 10)))
  );
  const today = kstDateStamp();
  const todayDay = Number(today.slice(8, 10));
  const hasVisitedToday = visitedDays.has(todayDay);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(
    `${today.slice(0, 7)}-01T00:00:00+09:00`
  ).getUTCDay();
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 pt-12 pb-32">
        <header className="flex items-center justify-between">
          <h1 className="font-bold text-[26px] text-white">내 정보</h1>
          <div className="flex items-center gap-4">
            {role === "admin" && (
              <Link
                className="text-[13px] text-zinc-500 underline-offset-2 hover:underline"
                href="/admin/books"
              >
                관리자
              </Link>
            )}
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
          </div>
        </header>

        <section className="mt-8 flex items-center gap-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-6">
          {profileImage ? (
            <Image
              alt="프로필 사진"
              className="rounded-full"
              height={64}
              priority
              src={profileImage}
              width={64}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 font-bold text-2xl text-zinc-500">
              {nickname?.slice(0, 1) ?? "?"}
            </div>
          )}
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="font-bold text-[18px] text-white">
              {nickname || "닉네임 미설정"}
            </span>
            <AutoCheckIn alreadyVisited={hasVisitedToday} />
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-6">
          <NicknameEditor initialNickname={nickname} />
          <Divider />
          <StatRow label="기록한 책" value={`${stats.recordCount}권`} />
          <Divider />
          <StatRow label="방문 횟수" value={`${stats.visitCount}회`} />
          <Divider />
          <StatRow label="이번 달" value={`${visitedDays.size}일`} />
        </section>

        <section className="mt-10">
          <h2 className="px-1 font-bold text-[18px] text-zinc-200">
            {year}년 {month}월
          </h2>
          <div className="mt-4 rounded-[24px] border border-zinc-900 bg-[#121212] p-5">
            <div className="mb-5 grid grid-cols-7 text-center font-bold text-[11px] text-zinc-600">
              {KO_WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center">
              {calendarCells.map((day, i) => (
                <div
                  className="relative flex aspect-square items-center justify-center"
                  key={day === null ? `pad-${i}` : `day-${day}`}
                >
                  {day === null ? null : (
                    <>
                      {visitedDays.has(day) && <VisitStamp day={day} />}
                      <span
                        className={
                          day === todayDay
                            ? "relative z-10 font-bold text-[14px] text-white"
                            : "relative z-10 font-semibold text-[14px] text-zinc-400"
                        }
                      >
                        {day}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
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

function VisitStamp({ day }: { day: number }) {
  // Deterministic per-day rotation so each "stamp" looks slightly
  // hand-pressed but stable across re-renders.
  const rotation = (((day * 13) % 13) - 6).toString();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400/70 bg-amber-500/10"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Image
        alt=""
        className="opacity-70"
        height={28}
        src="/logo.png"
        width={28}
      />
    </div>
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
