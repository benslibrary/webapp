"use client";

import { useRef, useState } from "react";

type InfoStepProps = {
  onSubmit: (nick: string, phone: string) => void;
  onSkip: () => void;
};

export function InfoStep({ onSubmit, onSkip }: InfoStepProps) {
  const [nick, setNick] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmedNick = nick.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedNick || !trimmedPhone) {
      setError("정보를 모두 입력해주세요.");
      return;
    }
    if (trimmedPhone.length !== 4 || !/^\d{4}$/.test(trimmedPhone)) {
      setError("전화번호 뒷자리 4자리를 입력해주세요.");
      return;
    }
    setError("");
    onSubmit(trimmedNick, trimmedPhone);
  };

  const handleLoad = () => {
    setError("불러오기 기능은 준비 중입니다.");
  };

  return (
    <section aria-label="정보 입력" className="archive-step active">
      <h1 className="archive-fade-up">
        당신의 정보를
        <br />
        입력해주세요
      </h1>
      <div className="archive-input-group archive-fade-up">
        <input
          aria-label="별명"
          className="archive-input"
          onChange={(e) => setNick(e.target.value)}
          placeholder="별명 입력"
          spellCheck={false}
          type="text"
          value={nick}
        />
        <input
          aria-label="전화번호 뒷자리 4자리"
          className="archive-input"
          maxLength={4}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="전화번호 뒷자리 4자리"
          ref={phoneRef}
          type="tel"
          value={phone}
        />
        {error && (
          <p className="text-sm mb-2" style={{ color: "var(--archive-point)" }}>
            {error}
          </p>
        )}
        <button
          className="archive-btn-main"
          onClick={handleSubmit}
          type="button"
        >
          입력하기
        </button>
        <button className="archive-btn-sub" onClick={handleLoad} type="button">
          불러오기
        </button>
        <button className="archive-btn-skip" onClick={onSkip} type="button">
          넘어갈래요
        </button>
      </div>
    </section>
  );
}
