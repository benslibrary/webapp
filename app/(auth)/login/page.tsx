import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-black font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col px-7 py-12">
        <div className="mt-20">
          <h1 className="font-bold text-[34px] leading-[1.3]">
            안녕하세요!
            <br />
            <span className="text-zinc-500">벤의 서재</span>에 오신걸
            <br />
            환영해요!
          </h1>
          <p className="mt-6 font-medium text-[18px] text-zinc-500 leading-relaxed">
            네이버 계정으로 로그인하고
            <br />
            매장에서 위치 권한을 허용해주세요.
          </p>
        </div>

        <div className="mt-10">
          <Suspense fallback={<LoginButtonSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function LoginButtonSkeleton() {
  return <div className="h-[68px] w-full rounded-[24px] bg-zinc-900" />;
}
