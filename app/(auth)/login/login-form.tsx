"use client";

import { SiNaver } from "@icons-pack/react-simple-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const callbackUrl = params.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  return (
    <div className="mb-4">
      <button
        className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#03C75A] py-5 font-bold text-[18px] text-white transition-all active:scale-[0.96]"
        onClick={() => signIn("naver", { callbackUrl })}
        type="button"
      >
        <SiNaver className="h-5 w-5" />
        네이버로 로그인
      </button>
    </div>
  );
}
