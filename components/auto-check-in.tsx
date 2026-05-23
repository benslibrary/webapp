"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Status =
  | "idle"
  | "locating"
  | "submitting"
  | "checkedIn"
  | "outOfRange"
  | "denied"
  | "unsupported"
  | "error";

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

/**
 * Mount on any page that needs a fresh check-in for today. On mount it
 * silently fetches the browser's location and POSTs to /api/visits.
 * Renders a compact status badge (success / locating / out-of-range /
 * permission-denied / unsupported / error) plus a retry affordance
 * for recoverable failures.
 *
 * The /api/visits endpoint is idempotent (409 if already visited
 * today), so re-mounting or retrying is safe.
 */
export function AutoCheckIn({ alreadyVisited }: { alreadyVisited: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(
    alreadyVisited ? "checkedIn" : "idle"
  );
  const runOnceGuard = useRef(false);

  const run = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("submitting");
        try {
          const res = await fetch("/api/visits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          if (res.ok || res.status === 409) {
            setStatus("checkedIn");
            router.refresh();
          } else if (res.status === 403) {
            setStatus("outOfRange");
          } else {
            setStatus("error");
          }
        } catch {
          setStatus("error");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      },
      GEO_OPTIONS
    );
  }, [router]);

  useEffect(() => {
    if (alreadyVisited || runOnceGuard.current) {
      return;
    }
    runOnceGuard.current = true;
    run();
  }, [alreadyVisited, run]);

  // Retry when the tab becomes visible again — covers the "open the app
  // on the way to the store, walk in with the tab already open" path so
  // the user doesn't have to refresh or hunt for 다시 시도.
  useEffect(() => {
    if (alreadyVisited) {
      return;
    }
    const handler = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      // Only retry if the previous attempt finished in a recoverable
      // state — don't kick off another geolocation request mid-flight.
      if (
        status === "outOfRange" ||
        status === "denied" ||
        status === "error" ||
        status === "unsupported"
      ) {
        run();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [alreadyVisited, status, run]);

  return <StatusBadge onRetry={run} status={status} />;
}

function StatusBadge({
  status,
  onRetry,
}: {
  status: Status;
  onRetry: () => void;
}) {
  if (status === "checkedIn") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1.5 font-bold text-[12px] text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
        오늘 출석 완료
      </span>
    );
  }
  if (status === "locating" || status === "submitting" || status === "idle") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-[12px] text-zinc-400">
        <Spinner />
        위치 확인 중…
      </span>
    );
  }
  if (status === "outOfRange") {
    return <RetryPill label="매장 밖이에요" onRetry={onRetry} />;
  }
  if (status === "denied") {
    return (
      <RetryPill
        hint="브라우저 설정에서 위치 권한을 허용해주세요."
        label="위치 권한 필요"
        onRetry={onRetry}
      />
    );
  }
  if (status === "unsupported") {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-[12px] text-zinc-500">
        위치 정보 미지원 브라우저
      </span>
    );
  }
  return <RetryPill label="오류가 발생했어요" onRetry={onRetry} />;
}

function RetryPill({
  label,
  hint,
  onRetry,
}: {
  label: string;
  hint?: string;
  onRetry: () => void;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-[12px] text-zinc-300">
      <span>{label}</span>
      <button
        className="underline-offset-2 hover:underline"
        onClick={onRetry}
        type="button"
      >
        다시 시도
      </button>
      {hint && (
        <span className="basis-full text-[11px] text-zinc-500">{hint}</span>
      )}
    </span>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3 w-3 animate-spin rounded-full border border-zinc-600 border-t-zinc-300"
    />
  );
}
