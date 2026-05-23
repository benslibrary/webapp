import type { PostKind } from "@/lib/db/schema";
import { kstDateStamp } from "@/lib/geo";

const KIND_STYLES: Record<
  PostKind,
  { background: string; ink: string; rotate: string }
> = {
  필사: { background: "#FFF59D", ink: "#3D2B00", rotate: "-rotate-1" },
  후기: { background: "#FFB4A2", ink: "#3D1106", rotate: "rotate-1" },
  메모: { background: "#C8E6C9", ink: "#0E2E10", rotate: "-rotate-1" },
};

const ROTATIONS_BY_INDEX = ["-rotate-1", "rotate-1", "rotate-0"] as const;

export function PostItCard({
  kind,
  content,
  bookTitle,
  authorNickname,
  createdAt,
  index,
}: {
  kind: PostKind;
  content: string;
  bookTitle: string | null;
  authorNickname: string | null;
  createdAt: Date;
  index: number;
}) {
  const style = KIND_STYLES[kind];
  const rotation = ROTATIONS_BY_INDEX[index % ROTATIONS_BY_INDEX.length];
  const date = kstDateStamp(createdAt).slice(5).replace("-", ".");

  return (
    <div
      className={`flex min-h-[160px] flex-col gap-2 rounded-[14px] p-4 shadow-lg shadow-black/40 transition-transform ${rotation} hover:rotate-0`}
      style={{ backgroundColor: style.background, color: style.ink }}
    >
      <div className="flex items-center justify-between text-[11px] opacity-70">
        <span className="font-bold uppercase tracking-wider">{kind}</span>
        <span>{date}</span>
      </div>
      {bookTitle && (
        <div className="font-bold text-[12px] opacity-80 leading-tight">
          📖 {bookTitle}
        </div>
      )}
      <p className="flex-1 whitespace-pre-wrap break-words font-medium text-[14px] leading-snug">
        {content}
      </p>
      <div className="text-[11px] opacity-60">
        — {authorNickname || "익명"}
      </div>
    </div>
  );
}
