"use client";

import Link from "next/link";

const ITEMS: { label: string; href: string | null }[] = [
  { label: "홈", href: null },
  { label: "책찾기", href: "/archive" },
  { label: "책추천", href: "/archive" },
  { label: "독서기록", href: "/archive" },
  { label: "로그인", href: "/login" },
];

export function BottomNav() {
  return (
    <nav aria-label="하단 메뉴" className="archive-bottom-nav">
      {ITEMS.map(({ label, href }) =>
        href ? (
          <Link className="archive-nav-item" href={href} key={label}>
            {label}
          </Link>
        ) : (
          <span
            aria-current="page"
            className="archive-nav-item active"
            key={label}
          >
            {label}
          </span>
        )
      )}
    </nav>
  );
}
