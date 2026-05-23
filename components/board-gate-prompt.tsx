import Link from "next/link";
import { AutoCheckIn } from "@/components/auto-check-in";

export function AnonymousBoardPrompt({ callbackUrl }: { callbackUrl: string }) {
  return (
    <GateLayout>
      <h1 className="font-bold text-[22px] text-white">로그인이 필요해요</h1>
      <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed">
        매장에 오신 손님만 보실 수 있어요. 먼저 네이버 계정으로 로그인해주세요.
      </p>
      <Link
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 font-bold text-[14px] text-black transition-all active:scale-95"
        href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      >
        네이버로 로그인
      </Link>
    </GateLayout>
  );
}

export function NeedsCheckInPrompt() {
  return (
    <GateLayout>
      <h1 className="font-bold text-[22px] text-white">
        매장에서만 이용할 수 있어요
      </h1>
      <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed">
        벤의 서재에 오시면 위치를 확인해 자동으로 출석돼요. 매장에 도착하셨다면
        잠시 기다려주세요.
      </p>
      <div className="mt-6">
        <AutoCheckIn alreadyVisited={false} />
      </div>
    </GateLayout>
  );
}

function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="flex w-full max-w-[430px] flex-col px-7 pt-24 pb-32">
        {children}
      </div>
    </main>
  );
}
