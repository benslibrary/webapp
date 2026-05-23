"use client";

import { Home, PenLine, Search, Users } from "lucide-react";
import type React from "react"; // [수정] useState 추가
import { useState } from "react";
import BookSearch from "@/components/library/book-search";

interface DashboardProps {
  nickname: string;
}

export default function Dashboard({ nickname }: DashboardProps) {
  // --- [상태 관리] ---
  const [isSearching, setIsSearching] = useState(false); // [추가] 검색창 활성화 스위치

  // 2026년 3월 데이터
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const visitDate = 1;

  // [추가] 검색창이 열려있으면 검색 컴포넌트만 보여줍니다.
  if (isSearching) {
    return <BookSearch onBack={() => setIsSearching(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-black pb-28 text-white animate-in fade-in duration-1000">
      {/* 1. 상단 타이틀 */}
      <header className="px-7 pt-14">
        <h1 className="text-[22px] font-bold tracking-tight">
          <span className="text-zinc-500">{nickname || "손님"}</span>님의 서재
        </h1>
      </header>

      {/* 2. 통계 섹션 */}
      <section className="mt-8 px-7">
        <div className="grid grid-cols-3 rounded-2xl border border-zinc-900 bg-zinc-900/30 py-6">
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              방문횟수
            </p>
            <p className="mt-1 text-[20px] font-bold">
              1
              <span className="ml-0.5 text-xs font-normal text-zinc-500">
                회
              </span>
            </p>
          </div>
          <div className="flex flex-col items-center border-x border-zinc-800/50">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              읽은 책
            </p>
            <p className="mt-1 text-[20px] font-bold">
              0
              <span className="ml-0.5 text-xs font-normal text-zinc-500">
                권
              </span>
            </p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              독서기록
            </p>
            <p className="mt-1 text-[20px] font-bold">
              0
              <span className="ml-0.5 text-xs font-normal text-zinc-500">
                회
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 3. 2026년 3월 캘린더 */}
      <section className="mt-12 px-7">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tighter text-zinc-400">
            2026년 3월
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold text-green-500 uppercase">
              Today
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-6 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div className="text-[10px] font-black text-zinc-700" key={d}>
              {d}
            </div>
          ))}
          {days.map((day) => (
            <div
              className="relative flex items-center justify-center text-xs"
              key={`day-${day}`}
            >
              <span
                className={
                  day === visitDate
                    ? "font-bold text-green-500"
                    : "text-zinc-500"
                }
              >
                {day}
              </span>
              {day === visitDate && (
                <div className="absolute -bottom-2 h-1 w-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. 하단 액션바 */}
      <nav className="fixed bottom-8 left-1/2 w-[92%] -translate-x-1/2 rounded-[28px] border border-white/5 bg-zinc-900/80 p-2 shadow-2xl backdrop-blur-xl">
        <ul className="flex items-center justify-around">
          <NavItem active icon={<Home size={20} />} label="홈" />

          {/* [수정] 책검색 클릭 시 스위치 On! */}
          <button
            className="flex-1"
            onClick={() => setIsSearching(true)}
            type="button"
          >
            <NavItem icon={<Search size={20} />} label="책검색" />
          </button>

          <NavItem icon={<PenLine size={20} />} label="기록하기" />
          <NavItem icon={<Users size={20} />} label="독서모임" />
        </ul>
      </nav>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 px-3 py-2 transition-all ${active ? "text-white" : "text-zinc-600"}`}
    >
      {icon}
      <span className="text-[9px] font-bold tracking-tighter">{label}</span>
    </div>
  );
}
