"use client";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <section aria-label="환영" className="archive-step active">
      <h1 className="archive-fade-up archive-delay-1">
        안녕하세요!
        <br />
        벤의서재에 오신걸 환영해요!
      </h1>
      <p className="archive-sub-txt archive-fade-up archive-delay-2">
        오늘은 어떤 재미있는 책을
        <br />
        발견해볼까요?
      </p>
      <div className="archive-fade-up archive-delay-3 w-full">
        <button className="archive-btn-main" onClick={onNext} type="button">
          시작하기
        </button>
      </div>
    </section>
  );
}
