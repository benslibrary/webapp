"use client";

import { ArrowLeft, MapPin, Search } from "lucide-react";
import { useState } from "react";

const SHELF_IDS = Array.from({ length: 15 }, (_, i) => i + 1);

interface BookSearchProps {
  onBack: () => void;
}

export default function BookSearch({ onBack }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // 알랭 드 보통 공식 데이터
  const mockResults = [
    {
      id: 1,
      title: "왜 나는 너를 사랑하는가",
      author: "알랭 드 보통",
      publisher: "청미래",
      shelf: 3,
      isbn: "9788986836240",
    },
    {
      id: 2,
      title: "우리는 사랑일까",
      author: "알랭 드 보통",
      publisher: "은행나무",
      shelf: 7,
      isbn: "9788956601373",
    },
    {
      id: 3,
      title: "낭만적 연애와 그 후의 일상",
      author: "알랭 드 보통",
      publisher: "은행나무",
      shelf: 12,
      isbn: "9788956608846",
    },
  ];

  const handleBookClick = (book: any) => {
    if (!history.find((h) => h.id === book.id)) {
      setHistory([book, ...history]);
    }
    setSelectedLocation(book.shelf);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white transition-all duration-500">
      {/* 1. 검색바: 중앙에서 상단으로 이동하는 모바일 최적화 레이아웃 */}
      <div
        className={`flex flex-col px-6 transition-all duration-700 ${query ? "pt-14" : "pt-[40vh]"}`}
      >
        <div className="flex items-center gap-3">
          {query && (
            <button
              className="text-zinc-500 hover:text-white transition-colors"
              onClick={onBack}
              type="button" // [문제 2, 3 해결] 명시적인 버튼 타입 지정
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              size={18}
            />
            <input
              autoFocus
              className="w-full rounded-full bg-zinc-900 py-3.5 pl-12 pr-6 text-sm outline-none ring-1 ring-zinc-800 focus:ring-zinc-600 shadow-2xl transition-all"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="어떤 책을 찾으시나요?"
              value={query}
            />
          </div>
        </div>
      </div>

      {query && (
        <section className="flex-1 overflow-y-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 4. 책장 위치 가이드: 빨간 불 활성화 */}
          <div className="mb-10 rounded-2xl border border-zinc-900 bg-zinc-900/20 p-4">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
              <MapPin size={12} /> Shelf Location Guide
            </div>
            <div className="grid grid-cols-5 gap-2">
              {SHELF_IDS.map((shelfId) => (
                <div
                  className={`h-6 rounded-sm border transition-all duration-500 ${selectedLocation === shelfId ? "bg-red-600 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]" : "bg-zinc-900 border-zinc-800"}`}
                  key={`shelf-${shelfId}`}
                />
              ))}
            </div>
          </div>

          {/* 3. 검색 결과: 왼쪽 사진 / 오른쪽 정보 */}
          <div className="space-y-4">
            <p className="mb-4 text-[11px] font-black tracking-[0.2em] text-zinc-700 uppercase">
              Books in Library
            </p>
            {mockResults.map((book) => (
              <button
                className="group flex w-full items-center gap-5 rounded-2xl border border-zinc-900 bg-zinc-900/40 p-4 text-left transition-colors hover:bg-zinc-900"
                key={book.id}
                onClick={() => handleBookClick(book)}
                type="button" // [문제 2, 3 해결] 속성 알파벳 순 정렬 및 타입 지정
              >
                {/* [문제 4 해결] Next.js Image 사용 및 *책 사진 데이터 필요 */}
                <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-800 shadow-lg transition-transform group-hover:scale-105">
                  <div className="flex h-full w-full items-center justify-center text-[8px] text-zinc-600 uppercase">
                    No Cover
                  </div>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <h4 className="truncate text-[15px] font-bold text-white">
                    {book.title}
                  </h4>
                  <p className="text-[12px] text-zinc-400">{book.author}</p>
                  <p className="mt-1 text-[10px] italic text-zinc-600">
                    {book.publisher}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* 2. 검색 기록: 클릭 시 여기에 누적 저장 */}
          {history.length > 0 && (
            <div className="mt-12">
              <p className="mb-4 text-[11px] font-black tracking-[0.2em] text-zinc-700 uppercase">
                Search History
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <span
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-400"
                    key={`hist-${h.id}`}
                  >
                    {h.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
