"use client";

import { useState } from "react";
import Dashboard from "@/components/library/dashboard";
import Onboarding from "@/components/library/onboarding";
import Opening from "@/components/library/opening";
import StampCard from "@/components/library/stamp-card";

export function LibraryFlow() {
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState({ nickname: "", phoneTail: "" });

  const handleOnboardingNext = (data: {
    nickname: string;
    phoneTail: string;
  }) => {
    setUserInfo(data);
    setStep(3);
  };

  return (
    <main className="flex min-h-screen w-full justify-center bg-zinc-950 font-sans text-white">
      <div className="relative flex w-full max-w-[430px] flex-col overflow-hidden border-zinc-900 border-x bg-black shadow-2xl">
        {step === 1 && <Opening onNext={() => setStep(2)} />}
        {step === 2 && (
          <Onboarding onNext={handleOnboardingNext} onSkip={() => setStep(3)} />
        )}
        {step === 3 && <StampCard onComplete={() => setStep(4)} />}
        {step === 4 && <Dashboard nickname={userInfo.nickname} />}
      </div>
    </main>
  );
}
