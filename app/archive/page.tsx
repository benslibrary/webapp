import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { getVisitsForUserInRange } from "@/lib/db/queries";
import { kstDateStamp, kstMonthBounds } from "@/lib/geo";
import { CheckInButton } from "./check-in-button";
import { LoginPrompt } from "./login-prompt";

const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ArchivePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ArchiveContent />
    </Suspense>
  );
}

async function ArchiveContent() {
  const session = await auth();

  if (!session?.user?.id) {
    return <LoginPrompt />;
  }

  const { start, end, year, month } = kstMonthBounds();
  const visits = await getVisitsForUserInRange({
    userId: session.user.id,
    start,
    end,
  });

  const visitedDays = new Set(
    visits.map((v) => Number(kstDateStamp(v.visitedAt).slice(8, 10)))
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
      <div className="relative flex w-full max-w-[430px] flex-col pb-24">
        <header className="px-7 pt-12">
          <h1 className="font-bold text-[26px] text-white">
            {session.user.nickname || "방문객"}님
          </h1>
          <div className="mt-8 flex justify-between rounded-[24px] border border-zinc-900 bg-[#121212] p-6 text-center">
            <Stat label="방문" value={`${visits.length}회`} />
            <Divider />
            <Stat label="이번 달" value={`${visitedDays.size}일`} />
            <Divider />
            <Stat label="오늘" value={hasVisitedToday ? "✓" : "-"} />
          </div>
        </header>

        <section className="mt-8 px-7">
          <CheckInButton disabled={hasVisitedToday} />
        </section>

        <section className="mt-10 px-7">
          <h3 className="mb-6 px-1 font-bold text-[18px] text-zinc-200">
            {year}년 {month}월
          </h3>
          <div className="rounded-[28px] border border-zinc-900 bg-[#121212] p-6">
            <div className="mb-6 grid grid-cols-7 text-center font-bold text-[12px] text-zinc-600">
              {KO_WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-7 text-center">
              {calendarCells.map((day, i) => (
                <div
                  className="relative flex flex-col items-center justify-center py-1"
                  key={`${day}-${i}`}
                >
                  {day === null ? null : (
                    <>
                      <span
                        className={
                          day === todayDay
                            ? "font-bold text-[16px] text-white"
                            : "font-semibold text-[16px] text-zinc-300"
                        }
                      >
                        {day}
                      </span>
                      {visitedDays.has(day) && (
                        <div className="-bottom-2 absolute h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col pb-24">
        <header className="px-7 pt-12">
          <div className="h-8 w-32 animate-pulse rounded bg-zinc-900" />
          <div className="mt-8 h-24 animate-pulse rounded-[24px] bg-zinc-900" />
        </header>
        <section className="mt-8 px-7">
          <div className="h-[68px] animate-pulse rounded-[24px] bg-zinc-900" />
        </section>
        <section className="mt-10 px-7">
          <div className="h-72 animate-pulse rounded-[28px] bg-zinc-900" />
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="font-medium text-[12px] text-zinc-500">{label}</span>
      <span className="font-bold text-[18px]">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="my-auto h-8 w-[1px] bg-zinc-800" />;
}
