"use client";

interface OpeningProps {
  onNext: () => void;
}

export default function Opening({ onNext }: OpeningProps) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-6 flex flex-1 flex-col justify-center px-7 duration-1000 text-white">
      <div className="mb-14">
        <h1 className="text-[32px] font-bold leading-[1.4] tracking-tighter break-keep">
          안녕하세요!
          <br />
          벤의서재에 오신것을
          <br />
          환영합니다!
        </h1>
      </div>

      <button
        className="w-full rounded-[24px] bg-white py-5 text-[18px] font-bold text-black shadow-2xl transition-transform active:scale-95"
        onClick={onNext}
        type="button"
      >
        시작하기
      </button>
    </section>
  );
}
