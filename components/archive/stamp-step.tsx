"use client";

import { useEffect, useState } from "react";

type StampStepProps = {
  initialVisitCount: number;
  onStamp: () => number;
  onGoHome: () => void;
};

const SLOTS = [1, 2, 3, 4, 5] as const;

export function StampStep({
  initialVisitCount,
  onStamp,
  onGoHome,
}: StampStepProps) {
  const [visitCount, setVisitCount] = useState(initialVisitCount);
  const [showNext, setShowNext] = useState(false);
  const [title, setTitle] = useState("출석 도장을 찍어드릴게요");
  const [showReward, setShowReward] = useState(initialVisitCount >= 5);

  useEffect(() => {
    setVisitCount(initialVisitCount);
    setShowReward(initialVisitCount >= 5);
  }, [initialVisitCount]);

  const handleStamp = () => {
    const next = onStamp();
    setVisitCount(next);
    if (next >= 5) {
      setShowReward(true);
      setTitle("🎉 축하합니다!");
    }
    setShowNext(true);
  };

  const stampedCount = visitCount;

  return (
    <section aria-label="출석 도장" className="archive-step active">
      <h1 id="archive-stamp-title">{title}</h1>
      <div className="archive-stamp-card">
        {SLOTS.map((n) => (
          <div
            className={`archive-stamp-slot ${n <= stampedCount ? "active-slot" : ""}`}
            key={n}
          >
            {n}
            <div
              aria-hidden
              className={`archive-mark-ink ${n <= stampedCount ? "stamped" : ""}`}
            >
              B
            </div>
          </div>
        ))}
      </div>

      {showReward && (
        <div className="archive-reward-msg">
          축하해요! 1회 무료쿠폰이 발급되었어요!
          <br />
          카운터에 이 화면을 보여주세요!
        </div>
      )}

      {stampedCount < 5 && !showNext && (
        <button
          className="archive-btn-main"
          onClick={handleStamp}
          type="button"
        >
          도장 꽝 찍기
        </button>
      )}
      {showNext && (
        <button className="archive-btn-sub" onClick={onGoHome} type="button">
          홈으로 가기
        </button>
      )}
    </section>
  );
}
