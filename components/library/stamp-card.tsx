"use client";

import Image from "next/image";
import { useEffect } from "react";

interface StampCardProps {
  onComplete: () => void;
}

export default function StampCard({ onComplete }: StampCardProps) {
  const stampSlots = [1, 2, 3, 4, 5];

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <section className="flex h-screen flex-col items-center justify-center bg-black text-white animate-in fade-in duration-700">
      <h2 className="mb-10 text-xl font-bold italic uppercase tracking-[0.3em] text-zinc-600">
        Visit Stamp
      </h2>

      <div className="grid grid-cols-5 gap-4 rounded-[32px] border border-zinc-900 bg-[#121212] p-8 shadow-2xl">
        {stampSlots.map((slot, index) => (
          <div
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-black"
            key={`slot-${slot}`}
          >
            {index === 0 && (
              <Image
                alt="stamp"
                className="animate-bounce-in object-cover"
                fill
                priority
                src="/logo.jpeg"
              />
            )}
          </div>
        ))}
      </div>

      <p className="mt-10 animate-pulse font-medium tracking-tight text-zinc-500">
        첫 방문 도장이 찍혔습니다!
      </p>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </section>
  );
}
