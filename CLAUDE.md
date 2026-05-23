# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This is **벤의 서재 (Ben's Library)** — a light Korean-language web app for in-store customers. The two product surfaces are:

1. **출석체크** at `/archive` — logged-in users tap a check-in button; the browser supplies geolocation; the server records a visit when the coords are within `STORE_RADIUS_M` of the store. The dashboard renders the user's KST month calendar with green dots on visited days.
2. **공용 포스트잇 게시판** at `/board` — anyone (including anonymous visitors) can read; only logged-in users can post. Three kinds: `필사 / 후기 / 메모`. Form lives at `/board/new`.

Authentication is **Naver OAuth only** (`developers.naver.com`). There is no email/password and no chatbot — the repo was bootstrapped from the Vercel Chat SDK template, and that lineage explains some of the leftover infrastructure (Drizzle, NextAuth, proxy.ts, ultracite, the Korean library/archive scaffolds), but all AI-related code was removed in `refactor: remove chatbot domain code (PR 1/4)`.

Production: https://benslibrary.com (Vercel, deployed from `main`).

## Common commands

Package manager is **pnpm 9.12.3** (see `packageManager` field). Do not use npm/yarn.

| Task | Command |
| --- | --- |
| Install deps | `pnpm install` |
| Dev server (Turbopack) | `pnpm dev` |
| Build (runs migrations first) | `pnpm build` |
| Build w/o migrations | `pnpm build:vercel` |
| Lint (Biome via Ultracite) | `pnpm lint` |
| Auto-fix lint/format | `pnpm format` |
| Run Playwright tests | `pnpm test` (`tests/` is currently empty; add cases here) |
| Drizzle: generate migration | `pnpm db:generate` |
| Drizzle: apply migrations | `pnpm db:migrate` |
| Drizzle: push schema | `pnpm db:push` |
| Drizzle Studio | `pnpm db:studio` |

Build skip note: `pnpm build` runs `tsx lib/db/migrate.ts` first — it silently no-ops if `POSTGRES_URL` is unset, so the build still works locally without a DB.

## Architecture overview

### Routing + auth gates

- `/` — public landing (`app/page.tsx`). A standalone 4-step React state machine carried over from earlier iterations; not currently a load-bearing page in the new product. Anonymous-friendly. Logged-in users are NOT auto-redirected.
- `/login` — Naver login. Static shell + Suspense'd client form (`app/(auth)/login/page.tsx` + `login-form.tsx`). Default `callbackUrl` is `/archive`.
- `/archive` — attendance dashboard. Async server content inside Suspense; shows `LoginPrompt` for anonymous, otherwise nickname + stats + KST month calendar + `CheckInButton`.
- `/board` — public read of posts (newest first). Authenticated users see a `+ 쓰기` button, anonymous users see a 로그인 link.
- `/board/new` — write form (server action via `createPostAction` in `app/board/actions.ts`). Server redirects to `/login` if no session.
- `/api/visits` — `POST` only. Validates session + geolocation. Returns 401/403/409/201.
- `/api/auth/[...nextauth]` — NextAuth handler (re-exports from `app/(auth)/auth.ts`).

**`proxy.ts` is the middleware** — Next is configured to call it instead of `middleware.ts`. After PR 2 it's stripped to a `/ping` passthrough; all auth gating happens at the route/action level (in server components via `auth()`, or in route handlers via the same).

### Auth (NextAuth v5 + Naver OAuth)

`app/(auth)/auth.ts` registers Naver as a custom OAuth provider against `nid.naver.com/oauth2.0/{authorize,token}` and `openapi.naver.com/v1/nid/me`. Naver's userinfo response is wrapped in `{ resultcode, message, response: {...} }`, so the `profile()` callback unwraps `profile.response`.

Flow on first login:
1. `signIn` callback receives the Naver profile and calls `upsertUserFromNaver()` to insert or update the row in our `User` table.
2. It then rewrites `user.id` to the **internal uuid** before the jwt callback fires — so `token.id` and `session.user.id` are our DB id, not the Naver id (which lives in `token.naverId`).
3. `nickname` and `profileImage` are also carried through token → session.

`AUTH_SECRET` is required in production. Dev falls back to a literal string in `lib/constants.ts` (`AUTH_SECRET_OR_DEV_FALLBACK`).

### Database (Drizzle + Postgres)

Schema (`lib/db/schema.ts`) has three tables:

- `User` — `id`, `naverId` (unique), `email`, `nickname`, `profileImage`, `createdAt`, `updatedAt`.
- `Visit` — `id`, `userId` (cascade fk), `visitedAt`, `lat`, `lng`. Indexed on `(userId, visitedAt)`.
- `Post` — `id`, `userId` (cascade fk), `kind` enum (`필사 / 후기 / 메모`), `content`, `bookTitle?`, `createdAt`.

Migrations `0000_*` through `0008_*` are leftovers from the Chat SDK era and create the now-defunct tables (Chat, Message*, Vote*, Document, Suggestion, Stream). `0012_drop_legacy_chat_tables.sql` drops all of them with `CASCADE`. New migrations from `0009_naver_user.sql` onward are hand-written because they were authored without a live DB connection; the journal at `lib/db/migrations/meta/_journal.json` is hand-maintained to match.

### Geolocation + KST time

`lib/geo.ts` is the source of truth for two things:

- `haversineMeters(a, b)` — distance check used by `POST /api/visits`. Compared against `STORE_RADIUS_M`.
- KST helpers (`kstDateStamp`, `kstDayBounds`, `kstMonthBounds`) — **all "today" / "this month" logic runs in Asia/Seoul** regardless of what timezone the serverless function runs in. The check-in endpoint uses `kstDayBounds()` to enforce one visit per KST calendar day.

`STORE_LAT`, `STORE_LNG`, `STORE_RADIUS_M` live in `lib/constants.ts` and are env-overridable. The defaults are placeholder Seoul coords (Gyeongbokgung-ish) — **operator must set the real values in Vercel env** before attendance is meaningful.

### Next 16 cacheComponents

`next.config.ts` sets `cacheComponents: true`. This is the new Next 16 mode that requires uncached data (async server components, `useSearchParams`, `useSession`, `next-themes` etc.) to live inside `<Suspense>` boundaries. The pattern used throughout this codebase:

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

You **cannot** use `export const dynamic = "force-dynamic"` — it errors out with cacheComponents. Wrap in Suspense instead. The `/login` page does the same thing for `useSearchParams`/`useSession` by splitting into a static page shell + a `LoginForm` client component inside Suspense.

### Components

- `components/ui/` — shadcn/ui primitives. **Excluded from Biome** (see `biome.jsonc`). Don't reformat. Most use the combined `radix-ui` meta-package; a few older ones still import `@radix-ui/react-dialog` / `@radix-ui/react-slot` directly.
- `components/bottom-nav.tsx` — shared bottom nav used by `/archive` and `/board`. Highlights the active tab via `usePathname`.
- `components/library/`, `components/archive/` — legacy library/stamp-card UI components carried over from earlier iterations. `app/page.tsx` and the archive layout still consume some of these. Treat them as design references rather than load-bearing code.

## Tooling notes

- **Lint via Ultracite/Biome** is pinned: `@biomejs/biome` 2.3.11 + `ultracite` 7.0.11. Newer versions of ultracite ship config keys that biome 2.3.11 doesn't recognize — don't auto-upgrade either of these without testing the other. There are pre-existing lint errors in `components/library/*` and `components/archive/*` that predate the refactor; they're out of scope for the current product work.
- **Tailwind CSS v4** with `@tailwindcss/postcss`. `app/globals.css` is the entry point.
- **OpenTelemetry** wired in `instrumentation.ts` via `@vercel/otel` (service name `ai-chatbot`, which is a stale name — fine to rename to `bens-library`).

## Required env vars

See `.env.example`. In Vercel production all four are required:

- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — register an app at `developers.naver.com/apps` and add `https://<domain>/api/auth/callback/naver` as the callback URL
- `POSTGRES_URL` — Neon via the Vercel integration
- Optional: `STORE_LAT`, `STORE_LNG`, `STORE_RADIUS_M` — defaults are placeholder Seoul coords
