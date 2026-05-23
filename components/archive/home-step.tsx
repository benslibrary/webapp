"use client";

import Link from "next/link";
import { useMemo } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const days: { day: number | null; isToday: boolean; hasDot: boolean }[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push({ day: null, isToday: false, hasDot: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      isToday: d === todayDate,
      hasDot: d % 3 === 1 && d <= 15,
    });
  }
  return { days, todayDate };
}

type HomeStepProps = {
  userName: string;
  visitCount: number;
  isGuest: boolean;
  onReset: () => void;
};

export function HomeStep({
  userName,
  visitCount,
  isGuest,
  onReset,
}: HomeStepProps) {
  const showLockNotice = isGuest;
  const statsLocked = isGuest;
  const calLocked = isGuest;

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = `${year}년 ${String(month + 1).padStart(2, "0")}월`;
  const { days } = useMemo(() => getCalendarDays(year, month), [year, month]);

  return (
    <section aria-label="홈" className="archive-step archive-step-home active">
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[11px] font-extrabold tracking-wider"
          style={{ color: "var(--archive-point)" }}
        >
          BEN&apos;S ARCHIVE 4.0
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            className="font-medium underline"
            href="/login"
            style={{ color: "var(--archive-gray-sub)" }}
          >
            로그인
          </Link>
          <Link
            className="font-medium underline"
            href="/register"
            style={{ color: "var(--archive-gray-sub)" }}
          >
            회원가입
          </Link>
        </div>
      </div>
      <h1>
        <span id="archive-user-nm">{userName}</span>님,
      </h1>
      <p
        className="text-[15px] mb-5"
        style={{ color: "var(--archive-gray-sub)" }}
      >
        오늘도 몰입의 즐거움을 느껴보세요.
      </p>

      {showLockNotice && (
        <div
          className="archive-lock-notice"
          style={{ display: "block", position: "relative", marginTop: 0 }}
        >
          정보를 입력하면 기록이 시작됩니다 🔒
        </div>
      )}

      <div
        className={`archive-stats-grid ${statsLocked ? "archive-locked" : ""}`}
        id="archive-stats-area"
      >
        <div className="border-r border-[#222]">
          <div className="archive-stat-val" id="archive-v-count-display">
            {visitCount}일
          </div>
          <div className="archive-stat-lbl">출석</div>
        </div>
        <div className="border-r border-[#222]">
          <div className="archive-stat-val">0권</div>
          <div className="archive-stat-lbl">독서량</div>
        </div>
        <div>
          <div className="archive-stat-val">0개</div>
          <div className="archive-stat-lbl">기록</div>
        </div>
      </div>

      <div
        className={`archive-cal-card ${calLocked ? "archive-locked" : ""}`}
        id="archive-cal-area"
      >
        <div className="archive-cal-head font-semibold">{monthLabel}</div>
        <div className="archive-cal-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ color: "#444" }}>
              {w}
            </div>
          ))}
          {days.map(({ day, isToday, hasDot }, i) => (
            <div key={day == null ? `pad-${i}` : `day-${day}`}>
              {day == null ? (
                ""
              ) : (
                <>
                  <span className={isToday ? "archive-today" : ""}>{day}</span>
                  {hasDot && <div className="archive-dot" />}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="archive-debug-reset" onClick={onReset} type="button">
        [ 테스트용: 데이터 초기화 후 다시 시작 ]
      </button>
    </section>
  );
}
