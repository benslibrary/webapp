"use client";

import { ArrowLeft, MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import bookData from "../../data/books.json";

interface Book {
  author: string;
  id: number;
  isbn: string;
  imageName: string;
  publisher: string;
  shelfX: number;
  shelfY: number;
  title: string;
}

export default function BookSearch({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [history, setHistory] = useState<Book[]>([]);

  const filteredBooks = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    return (bookData as Book[]).filter((book) => {
      const searchTarget = query.toLowerCase();
      return (
        book.title.toLowerCase().includes(searchTarget) ||
        book.author.toLowerCase().includes(searchTarget)
      );
    });
  }, [query]);

  const handleBookClick = (book: Book) => {
    if (
      !history.find((h) => {
        return h.id === book.id;
      })
    ) {
      setHistory([book, ...history]);
    }
    setSelectedBook(book);
    setIsMapOpen(true);
  };

  // --- [개편된 지도 안내 뷰: 정보 + 지도 결합] ---
  if (isMapOpen && selectedBook) {
    return (
      <div className="absolute inset-0 z-[60] flex flex-col bg-black animate-in slide-in-from-right duration-300">
        <header className="flex items-center gap-4 border-b border-zinc-900 px-6 pt-14 pb-6">
          <button
            className="text-zinc-400"
            onClick={() => {
              setIsMapOpen(false);
            }}
            type="button"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="overflow-hidden text-left font-bold text-white text-sm">
            도서 위치 안내
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {/* 1. 상단: 선택한 책 정보 카드 */}
          <section className="bg-zinc-900/30 p-6 border-b border-zinc-900">
            <div className="flex gap-5">
              <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-zinc-800 shadow-2xl">
                <Image
                  alt={selectedBook.title}
                  className="object-cover"
                  fill
                  src={`/images/books/${selectedBook.imageName}`}
                />
              </div>
              <div className="flex flex-col justify-center overflow-hidden text-left">
                <h2 className="truncate text-lg font-black text-white leading-tight">
                  {selectedBook.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedBook.author}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-600 font-bold uppercase tracking-wider">
                  {selectedBook.publisher}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-red-500 font-bold text-[12px]">
                  <MapPin size={14} />
                  <span>우측 5번 서가 (3시 방향)</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 하단: 지도 브리핑 영역 */}
          <section className="p-8">
            <div className="relative aspect-[1434/1669] w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              <Image
                alt="Floor Plan"
                className="object-cover opacity-60"
                fill
                src="/images/map/floorplan.jpeg"
              />

              {/* 빨간 점: JSON 좌표 기반 실시간 마킹 */}
              <div
                className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${selectedBook.shelfX}%`,
                  top: `${selectedBook.shelfY}%`,
                }}
              >
                <div className="absolute inset-0 animate-ping rounded-full bg-red-600 opacity-75" />
                <div className="relative h-full w-full rounded-full border-2 border-white bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)]" />
              </div>
            </div>
            <p className="mt-6 text-center text-[11px] text-zinc-600 font-medium">
              *지도의 빨간 점 위치가 현재 도서가 있는 곳입니다.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-300 text-left">
      <div
        className={`px-6 transition-all duration-700 ${query ? "pt-14" : "pt-[40vh]"}`}
      >
        <div className="flex items-center gap-3">
          {query && (
            <button
              className="text-zinc-500"
              onClick={() => {
                onBack();
              }}
              type="button"
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
              className="w-full rounded-full bg-zinc-900 py-3.5 pl-12 pr-10 text-sm outline-none ring-1 ring-zinc-800 focus:ring-zinc-600 shadow-2xl"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="제목 또는 저자 검색"
              value={query}
            />
            {query && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                onClick={() => {
                  setQuery("");
                }}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {query && (
        <section className="flex-1 overflow-y-auto px-6 py-10 animate-in slide-in-from-bottom-4">
          <div className="space-y-4">
            <p className="mb-4 text-[10px] font-black tracking-[0.3em] text-zinc-800 uppercase italic">
              Search Results
            </p>
            {filteredBooks.map((book) => {
              return (
                <button
                  className="group flex w-full items-center gap-5 rounded-2xl border border-zinc-900 bg-zinc-900/40 p-4 text-left transition-colors hover:bg-zinc-900 shadow-lg"
                  key={book.id}
                  onClick={() => {
                    handleBookClick(book);
                  }}
                  type="button"
                >
                  <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-800 shadow-xl">
                    <Image
                      alt={book.title}
                      className="object-cover"
                      fill
                      src={`/images/books/${book.imageName}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <h4 className="truncate text-[15px] font-bold text-white">
                      {book.title}
                    </h4>
                    <p className="text-[12px] text-zinc-400">{book.author}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
