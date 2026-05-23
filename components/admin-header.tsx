import Link from "next/link";

const TABS = [
  { label: "도서", href: "/admin/books" },
  { label: "기록", href: "/admin/records" },
] as const;

type AdminHeaderProps = {
  active: "books" | "records";
  backHref?: string;
  backLabel?: string;
};

export function AdminHeader({
  active,
  backHref = "/me",
  backLabel = "내정보",
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-zinc-900 border-b bg-black/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-6 px-6 py-3.5">
        <Link
          aria-label={`${backLabel}으로 돌아가기`}
          className="flex items-center gap-1 font-medium text-[13px] text-zinc-400 hover:text-white"
          href={backHref}
        >
          <span aria-hidden>←</span>
          <span>{backLabel}</span>
        </Link>

        <span className="font-bold text-[16px] text-white">관리자</span>

        <nav className="flex items-center gap-1.5">
          {TABS.map((tab) => {
            const isActive = tab.href === `/admin/${active}`;
            return (
              <Link
                className={
                  isActive
                    ? "rounded-full bg-white px-4 py-1.5 font-bold text-[13px] text-black"
                    : "rounded-full border border-zinc-800 px-4 py-1.5 font-medium text-[13px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }
                href={tab.href}
                key={tab.href}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
