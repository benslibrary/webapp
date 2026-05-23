"use client";

import { Calendar, StickyNote, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const STATIC_ITEMS = [
  { label: "출석", href: "/archive", icon: Calendar },
  { label: "게시판", href: "/board", icon: StickyNote },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const accountItem =
    status === "authenticated"
      ? { label: "내정보", href: "/me", icon: User }
      : { label: "로그인", href: "/login", icon: User };
  const items = [...STATIC_ITEMS, accountItem];

  return (
    <nav
      aria-label="하단 메뉴"
      className="-translate-x-1/2 fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] justify-around border-zinc-900 border-t bg-black/90 py-4 backdrop-blur-lg"
    >
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            className={
              active
                ? "flex flex-col items-center gap-1 text-white"
                : "flex flex-col items-center gap-1 text-zinc-600"
            }
            href={href}
            key={href}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
