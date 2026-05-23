"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Status = "idle" | "locating" | "submitting";

export function CheckInButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  const handleClick = () => {
    if (disabled || status !== "idle") {
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("이 브라우저는 위치 정보를 지원하지 않아요.");
      return;
    }

    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("submitting");
        try {
          const res = await fetch("/api/visits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          const data = await res.json();

          if (res.ok) {
            toast.success("출석 도장이 찍혔어요! 🎉");
            router.refresh();
          } else if (res.status === 409) {
            toast.info(data.error ?? "이미 출석했어요.");
            router.refresh();
          } else if (res.status === 403) {
            toast.error(
              data.error ?? "매장 근처에서만 출석 체크가 가능합니다."
            );
          } else if (res.status === 401) {
            toast.error("로그인이 필요해요.");
            router.push("/login?callbackUrl=/archive");
          } else {
            toast.error(data.error ?? "출석 체크에 실패했어요.");
          }
        } catch (_e) {
          toast.error("네트워크 오류가 발생했어요.");
        } finally {
          setStatus("idle");
        }
      },
      (error) => {
        setStatus("idle");
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("위치 권한을 허용해주세요.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("위치 정보를 가져올 수 없어요.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("위치 확인 시간이 초과되었어요.");
        } else {
          toast.error("위치 정보를 가져오는 중 오류가 발생했어요.");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const label = (() => {
    if (disabled) {
      return "오늘 출석 완료";
    }
    if (status === "locating") {
      return "위치 확인 중…";
    }
    if (status === "submitting") {
      return "출석 등록 중…";
    }
    return "출석 체크하기";
  })();

  return (
    <button
      className={
        disabled
          ? "w-full cursor-not-allowed rounded-[24px] bg-zinc-900 py-5 font-bold text-[18px] text-zinc-600"
          : "w-full rounded-[24px] bg-white py-5 font-bold text-[18px] text-black transition-all active:scale-[0.96] disabled:cursor-wait disabled:opacity-70"
      }
      disabled={disabled || status !== "idle"}
      onClick={handleClick}
      type="button"
    >
      {label}
    </button>
  );
}
