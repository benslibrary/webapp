import Link from "next/link";

const TABS = [
  { label: "도서", href: "/admin/books" },
  { label: "기록", href: "/admin/records" },
] as const;

export function AdminHeader({ active }: { active: "books" | "records" }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-[26px] text-white">관리자</h1>
        <Link
          className="text-[13px] text-zinc-500 underline-offset-2 hover:underline"
          href="/me"
        >
          ← 내정보
        </Link>
      </div>
      <nav className="flex gap-2">
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
    </header>
  );
}
