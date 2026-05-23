import Link from "next/link";

export function LoginPrompt() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col justify-between px-7 py-12">
        <div className="mt-20">
          <h1 className="font-bold text-[34px] leading-[1.3]">
            출석체크 하려면
            <br />
            로그인이 필요해요.
          </h1>
          <p className="mt-6 font-medium text-[18px] text-zinc-500 leading-relaxed">
            네이버 계정으로 로그인하고
            <br />
            오늘의 방문을 기록해보세요.
          </p>
        </div>
        <Link
          className="mb-4 flex w-full items-center justify-center rounded-[24px] bg-white py-5 font-bold text-[18px] text-black transition-all active:scale-[0.96]"
          href="/login?callbackUrl=/archive"
        >
          로그인하러 가기
        </Link>
      </div>
    </main>
  );
}
