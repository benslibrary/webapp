# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

**벤의 서재 (Ben's Library)** — a light Korean-language web app for in-store customers of a small bookcafe. Three product surfaces:

1. **출석체크** at `/archive` — logged-in users tap a check-in button; the browser supplies geolocation; the server records a visit when the coords are within `STORE_RADIUS_M` of the store. KST month calendar with green dots on visited days.
2. **도서관** at `/books` (browse) / `/books/[isbn]` (detail) — public catalog. Books are curated by the operator via `/admin/books`, which uses 국립중앙도서관 Open API to fetch metadata by ISBN.
3. **기록** at `/records` (latest 30 public) / `/records/new` (login required) — short 독서 감상 entries, each tied to a Book in the catalog via FK. Users edit/delete their own from `/me`.

Authentication is **Naver OAuth only** (`developers.naver.com`). There is no email/password. Anonymous read is allowed on `/`, `/records`, `/books`, `/books/[isbn]`. The repo was bootstrapped from the Vercel Chat SDK template; all AI/chat code was removed in earlier refactors.

Production: <https://benslibrary.com> (Vercel, `main`).

## Common commands

Package manager is **pnpm 9.12.3** (see `packageManager`). Do not use npm/yarn.

| Task | Command |
| --- | --- |
| Install deps | `pnpm install` |
| Dev server (Turbopack) | `pnpm dev` |
| Build (runs migrations first) | `pnpm build` |
| Build w/o migrations | `pnpm build:vercel` |
| Lint (Biome via Ultracite) | `pnpm lint` |
| Auto-fix lint/format | `pnpm format` |
| Run Playwright tests | `pnpm test` |
| Drizzle: generate migration | `pnpm db:generate` |
| Drizzle: apply migrations | `pnpm db:migrate` |
| Drizzle Studio | `pnpm db:studio` |

Build skip note: `pnpm build` runs `tsx lib/db/migrate.ts` first — it silently no-ops if the Postgres URL is unset, so the build still works locally without a DB.

## Architecture overview

### Routing + auth gates

- `/` — anonymous landing (`app/page.tsx`). Authenticated visitors are redirected to `/archive`.
- `/login` — Naver login. Static shell + Suspense'd client form. Default `callbackUrl` is `/archive`.
- `/archive` — attendance dashboard. Shows `LoginPrompt` for anonymous, otherwise nickname + stats + KST month calendar + `CheckInButton`.
- `/books`, `/books/[isbn]` — public catalog browse + detail. Detail page reads `Record` entries for the book.
- `/records`, `/records/new` — record wall + write form. `/records/new` requires login (server-side redirect).
- `/admin/books` — admin-gated catalog management. Uses `requireAdmin()` from `lib/auth-helpers.ts`.
- `/me` — profile + editable nickname + list of own records with inline edit/delete + sign out.
- `/api/visits` — `POST` only. Validates session + geolocation. Returns 401/403/409/201.
- `/api/auth/[...nextauth]` — NextAuth handler (re-exports from `app/(auth)/auth.ts`).
- `/ping` — handled by `proxy.ts` as a simple passthrough for the smoke test.

**`proxy.ts` is the middleware** — Next is configured to call it instead of `middleware.ts`. After repeated cleanup it now just returns `"pong"` for `/ping` and passes everything else through. All auth gating happens at the route/action level via `auth()` or `requireAdmin()`.

### Auth (NextAuth v5 + Naver OAuth)

`app/(auth)/auth.ts` registers Naver as a custom OAuth provider against `nid.naver.com/oauth2.0/{authorize,token}` and `openapi.naver.com/v1/nid/me`. Naver's userinfo response is wrapped in `{ resultcode, message, response: {...} }`, so the `profile()` callback unwraps `profile.response`.

Flow on first login:
1. `signIn` callback receives the Naver profile and calls `upsertUserFromNaver()` to insert or update the row in our `User` table.
2. It then rewrites `user.id` to the **internal uuid** before the jwt callback fires — so `token.id` and `session.user.id` are our DB id, not the Naver id (which lives in `token.naverId`).
3. `nickname`, `realName`, `profileImage` are carried through token → session. `role` from the DB row is also carried so admin pages can check `session.user.role`.

`jwt` callback also handles `trigger === "update"` to refresh the token when the user changes their nickname client-side via `useSession().update({ nickname: ... })`.

First admin is promoted manually via Neon Studio after their first login:

```sql
UPDATE "User" SET role = 'admin' WHERE "naverId" = '<their naver id>';
```

`AUTH_SECRET` is required in production. Dev falls back to a literal string in `lib/constants.ts` (`AUTH_SECRET_OR_DEV_FALLBACK`).

### Database (Drizzle + Neon Postgres)

Schema (`lib/db/schema.ts`) has four tables:

- `User` — `id`, `naverId` (unique), `email`, `nickname`, `name`, `profileImage`, `role` (enum `customer` / `admin`), `createdAt`, `updatedAt`.
- `Visit` — `id`, `userId` (cascade fk), `visitedAt`, `lat`, `lng`. Indexed on `(userId, visitedAt)`.
- `Book` — `id`, `isbn` (unique varchar(13)), `title`, `author`, `publisher`, `publishDate` (YYYYMMDD string), `coverImageUrl`, `description` (NL introduction URL), `kdc`, `addedByUserId` (set null on user delete), `fetchedAt`, `createdAt`. Indexes on `isbn` (unique) and `title`.
- `Record` — `id`, `userId` (cascade fk), `bookId` (cascade fk), `content`, `createdAt`, `updatedAt`. Indexes on `createdAt`, `userId`, `bookId`.

**Connection URL**: `lib/db/connection.ts` `getPostgresUrl()` reads `BENSLIB_POSTGRES_URL` first (Vercel Neon integration) and falls back to `POSTGRES_URL` (local `.env.local`). `getPostgresUrl({ preferUnpooled: true })` for migrations promotes `BENSLIB_POSTGRES_URL_NON_POOLING` to the head of the chain — DDL should not go through pgbouncer.

Migrations `0000_*` through `0008_*` are leftovers from the Chat SDK era and create the now-defunct tables (Chat, Message*, Vote*, Document, Suggestion, Stream); `0012_drop_legacy_chat_tables.sql` drops them all with `CASCADE`. Current schema migrations start at `0009_naver_user.sql` and run through `0016_record.sql`. The `lib/db/migrations/meta/_journal.json` is hand-maintained.

### Geolocation + KST time

`lib/geo.ts` is the source of truth for two things:

- `haversineMeters(a, b)` — distance check used by `POST /api/visits`. Compared against `STORE_RADIUS_M`.
- KST helpers (`kstDateStamp`, `kstDayBounds`, `kstMonthBounds`) — **all "today" / "this month" logic runs in Asia/Seoul** regardless of what timezone the serverless function runs in. The check-in endpoint uses `kstDayBounds()` to enforce one visit per KST calendar day.

`STORE_LAT`, `STORE_LNG`, `STORE_RADIUS_M` live in `lib/constants.ts` and are env-overridable. The defaults are placeholder Seoul coords — **operator must set the real values in Vercel env** before attendance is meaningful.

### Book catalog + NL API

`lib/nat-lib.ts` wraps 국립중앙도서관 `seoji/SearchApi.do` (ISBN bibliographic data). `lookupBookByIsbn(isbn)` returns a discriminated union `{ ok, metadata }` | `{ ok: false, reason }` so the admin UI can surface specific failure reasons (bad ISBN, missing key, network, HTTP, JSON, empty docs, missing title).

`/admin/books` accepts whitespace/comma-separated ISBNs in a textarea, fetches each sequentially (~200ms each), upserts via `upsertBook()`. ~20-30 ISBNs per submit fits inside Vercel's default 10s function timeout.

`docs/NAT_LIB_API.md` is the full API reference for the five 국립중앙도서관 endpoints; only the ISBN one is in use today.

### Next 16 cacheComponents

`next.config.ts` sets `cacheComponents: true`. This is the Next 16 mode that requires uncached data (async server components, `useSearchParams`, `useSession`, dynamic route params) to live inside `<Suspense>` boundaries. Every dynamic route in this codebase follows this pattern:

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PageContent />
    </Suspense>
  );
}

async function PageContent() {
  const session = await auth();
  // ...
}
```

You **cannot** use `export const dynamic = "force-dynamic"` — it errors out with cacheComponents. Wrap in Suspense instead. `BottomNav` does the same trick internally — its `usePathname`/`useSession` calls are wrapped so dynamic-route prerenders don't fail (originally broke `/books/[isbn]`).

### Components

- `components/bottom-nav.tsx` — shared bottom nav used by `/archive`, `/records`, `/books`, `/admin/books`, `/me`. Three tabs: 출석 / 기록 / (로그인 또는 내정보). Third tab swaps based on `useSession()` status.
- `components/archive/font-loader.tsx` — client component that injects a Pretendard `<link>` via `useEffect`, used by `app/archive/layout.tsx`. Only file left under `components/archive/`.
- `components/toast.tsx` — small `sonner` wrapper. Used implicitly through `toast.success` / `toast.error` in client components.

### Favicon

`app/icon.png` and `app/apple-icon.png` are the actual store logo (960×947 PNG that was originally committed as `public/logo.jpeg`). Next 16's app-icon convention auto-uses these — no `<link>` tags needed. The same image is also at `public/logo.png` for use as an OG image or future header logo without colliding with the app-icon route.

## Tooling notes

- **Lint via Ultracite/Biome** is pinned: `@biomejs/biome` 2.3.11 + `ultracite` 7.0.11. Newer versions of ultracite ship config keys that biome 2.3.11 doesn't recognize — don't auto-upgrade either of these without testing the other.
- **Tailwind CSS v4** with `@tailwindcss/postcss`. `app/globals.css` is the entry. The codebase doesn't use any shadcn/ui primitives — every screen is plain Tailwind on top of `bg-black text-white`.
- **OpenTelemetry** wired in `instrumentation.ts` via `@vercel/otel` (`serviceName: "bens-library"`).

## Required env vars

See `.env.example`. In Vercel production:

- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — `developers.naver.com/apps`, callback `https://<domain>/api/auth/callback/naver`
- `NAT_LIB_API_KEY` — 국립중앙도서관 Open API key (server-only — never expose with `NEXT_PUBLIC_`)
- `BENSLIB_POSTGRES_URL` (+ `BENSLIB_POSTGRES_URL_NON_POOLING`) — auto-provisioned by the Vercel Neon integration when set up with prefix `BENSLIB_`
- `STORE_LAT`, `STORE_LNG` — real storefront coords (currently `37.5597269`, `126.8317699` for 강서구 공항대로 219)
- Optional: `STORE_RADIUS_M` (default 100)
