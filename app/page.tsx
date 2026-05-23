import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";

export default function Page() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <PageContent />
    </Suspense>
  );
}

async function PageContent() {
  const session = await auth();
  if (session?.user) {
    redirect("/me");
  }
  return <Landing />;
}

function Landing() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col justify-between px-7 py-12">
        <div className="mt-20">
          <h1 className="font-bold text-[34px] leading-[1.3]">
            안녕하세요!
            <br />
            <span className="text-zinc-500">벤의 서재</span>에 오신걸
            <br />
            환영해요!
          </h1>
          <p className="mt-6 font-medium text-[18px] text-zinc-500 leading-relaxed">
            출석체크와 메모 작성은 로그인 후
            <br />
            이용하실 수 있어요.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <Link
            className="flex w-full items-center justify-center rounded-[24px] bg-white py-5 font-bold text-[18px] text-black transition-all active:scale-[0.96]"
            href="/login"
          >
            시작하기
          </Link>
          <Link
            className="flex w-full items-center justify-center rounded-[24px] border border-zinc-800 py-4 font-medium text-[15px] text-zinc-400 transition-all active:scale-[0.97]"
            href="/records"
          >
            기록 둘러보기
          </Link>
        </div>
      </div>
    </main>
  );
}

function LandingSkeleton() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 py-12">
        <div className="mt-20 h-12 w-3/4 animate-pulse rounded bg-zinc-900" />
        <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-zinc-900" />
      </div>
    </main>
  );
}
