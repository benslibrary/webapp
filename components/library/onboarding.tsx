"use client";

import { useState } from "react";

interface OnboardingProps {
  onNext: (data: { nickname: string; phoneTail: string }) => void;
  onSkip: () => void;
}

// ⬇️ 여기 'export default'가 반드시 있어야 합니다!
export default function Onboarding({ onNext, onSkip }: OnboardingProps) {
  const [nickname, setNickname] = useState("");
  const [phoneTail, setPhoneTail] = useState("");
  const [agreed, setAgreed] = useState(false);

  const isFormValid =
    nickname.trim() !== "" && phoneTail.length === 4 && agreed;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-6 flex flex-1 flex-col px-7 py-12 duration-700 text-white">
      <h1 className="mt-10 text-[28px] font-bold leading-tight">
        반가워요!
        <br />
        누구라고 불러드릴까요?
      </h1>

      <div className="mt-8 flex flex-col gap-4 rounded-[24px] bg-[#1a1a1b] p-6 shadow-inner">
        <p className="text-sm font-bold text-white mb-1">
          별명을 저장하면 다음 기능이 활성화되요!!
        </p>
        <ul className="flex flex-col gap-3 text-[13px] font-medium text-zinc-400">
          <li>• 5회 방문 시 1회 무료이용권 지급</li>
          <li>• 5회 독서기록 시 1회 무료이용권 지급</li>
          <li>• 독서기록 아카이빙 기능 활성화</li>
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        <input
          className="w-full border-b-2 border-zinc-800 bg-transparent py-3 text-[22px] outline-none focus:border-white"
          onChange={(e) => setNickname(e.target.value)}
          placeholder="별명"
          value={nickname}
        />
        <input
          className="w-full border-b-2 border-zinc-800 bg-transparent py-3 text-[22px] outline-none focus:border-white"
          maxLength={4}
          onChange={(e) => setPhoneTail(e.target.value)}
          placeholder="번호 뒷자리"
          value={phoneTail}
        />

        <label
          className="flex items-center gap-3 cursor-pointer"
          htmlFor="agree"
        >
          <input
            checked={agreed}
            className="h-5 w-5 accent-white"
            id="agree"
            onChange={(e) => setAgreed(e.target.checked)}
            type="checkbox"
          />
          <span className="text-sm text-zinc-500">
            개인정보 수집 동의 (필수)
          </span>
        </label>

        <div className="flex flex-col gap-4">
          <button
            className={`w-full rounded-[24px] py-5 text-[18px] font-bold transition-all ${
              isFormValid ? "bg-white text-black" : "bg-zinc-900 text-zinc-600"
            }`}
            onClick={() => isFormValid && onNext({ nickname, phoneTail })}
            type="button"
          >
            나만의 서재 입장하기
          </button>

          <button
            className="w-full py-2 text-[15px] text-white/30"
            onClick={onSkip}
            type="button"
          >
            오늘은 둘러볼게요
          </button>
        </div>
      </div>
    </section>
  );
}
