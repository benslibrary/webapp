# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

**벤의 서재 (Ben's Library)** — a light Korean-language web app for in-store customers of a small bookcafe. Three product surfaces:

1. **출석** — auto check-in. The `/me` page mounts `<AutoCheckIn>` (client component) which, on load, asks for browser geolocation and silently POSTs to `/api/visits`. A successful visit within `STORE_RADIUS_M` of the storefront unlocks the rest of the app for the rest of the KST day. The explicit 출석 button is gone — being on the page in the store is enough.
2. **도서관** at `/books` (browse) / `/books/[isbn]` (detail) — operator-curated catalog. Each book detail page shows a 책방지기 amber post-it card if `Book.ownerComment` is set, plus the visitor-written records for that book.
3. **기록** at `/records` (latest 30 public) / `/records/new` (write a record). Short 독서 감상 entries each tied to a Book via FK. Users edit/delete their own from `/me`.

Authentication is **Naver OAuth only** (`developers.naver.com`). No email/password.

**In-store gate**: every page that isn't the landing redirect, `/login`, `/me`, or `/admin/*` is behind `getBoardAccess()`. Anonymous visitors get the 로그인 prompt; logged-in visitors who haven't checked in today (KST) get the 출석체크 prompt that itself embeds AutoCheckIn. Admins bypass the gate.

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
| Apply migrations (our runner) | `pnpm db:migrate` |
| Drizzle Studio | `pnpm db:studio` |

`pnpm db:migrate` uses **our own runner** in `lib/db/migrate.ts` — not drizzle-orm's `migrate()`, which silently skipped pending entries when journal hashes drifted. The runner tracks applied files in a `__migrations` table, backfills from `__drizzle_migrations` on first run, and only applies what's pending. Each migration file should be written idempotent (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`) so a partial-run re-execution is safe.

## Architecture overview

### Routing + auth gates

- `/` — server redirect: authenticated → `/me`, anonymous → `/login`. No more 시작하기 landing.
- `/login` — Naver login. Static shell + Suspense'd client form. Default `callbackUrl` is `/me`.
- `/me` — profile + nickname editor + visit stats + KST month calendar + own records list. Mounts `<AutoCheckIn>` which fires the geolocation request on mount.
- `/records` — public board, behind the in-store gate. Sticky header with + 작성 CTA.
- `/records/new` — write a record, behind the in-store gate.
- `/books`, `/books/[isbn]` — catalog browse + detail, behind the in-store gate. Detail page shows 책방지기 post-it if present + records for the book.
- `/admin/books` — admin grid (max-w-screen-2xl) of every book with cover, title, author, ISBN; client-side search (제목·작가·ISBN). Each card has 편집/삭제 buttons; cards without covers show a dashed "+ 표지 추가" placeholder.
- `/admin/books/new` — title/author search against NL → results list → one-click add (lookup ISBN, upload cover to Blob, upsert).
- `/admin/books/[isbn]/edit` — full per-book edit: cover upload (4MB max), 책방지기 코멘트, title/author/publisher/publishDate/KDC/description.
- `/admin/records` — moderation list of latest 100 records with author/book/content/date + 삭제 (two-step confirm).
- `/api/visits` — `POST` only. Validates session + geolocation. Returns 401/403/409/201. Unique index on `(userId, KST date)` catches concurrent POSTs.
- `/api/auth/[...nextauth]` — NextAuth handler.
- `/ping` — health check.

**Auth helpers** in `lib/auth-helpers.ts`:
- `requireAdmin(callbackUrl?)` — redirects non-admins.
- `getBoardAccess()` — returns `{ kind: "anonymous" | "needsCheckIn" | "ok"; session?, isAdmin? }`. Admins always `ok` (bypass the geofence). Non-admin needs a Visit row inside today's KST day; checked via `hasVisitedInRange()` (one SELECT … LIMIT 1).

### Auth (NextAuth v5 + Naver OAuth)

`app/(auth)/auth.ts` registers Naver as a custom OAuth provider against `nid.naver.com/oauth2.0/{authorize,token}` and `openapi.naver.com/v1/nid/me`. Naver's userinfo response is wrapped in `{ resultcode, message, response: {...} }`, so the `profile()` callback unwraps `profile.response`.

Flow on first login:
1. `signIn` callback calls `upsertUserFromNaver()`. On **first signup**, inserts every Naver field. On **re-login**, only refreshes `profileImage` and `updatedAt` — `nickname`, `name`, `email` stay user-controlled (NicknameEditor on /me).
2. Before `jwt()` runs, `signIn` rewrites `user.id`, `user.role`, `user.nickname`, `user.realName`, `user.profileImage` from the DB row so the JWT carries the persisted values, not the inbound Naver ones.
3. `jwt` also handles `trigger === "update"` so client-side `useSession().update({ nickname })` refreshes the token without a re-login.

First admin is promoted manually via the `scripts/promote-admin.ts` helper:
```bash
pnpm tsx scripts/promote-admin.ts <email|naverId|nickname>
```

`AUTH_SECRET` is required in production; dev falls back to a literal string in `lib/constants.ts`.

### Database (Drizzle + Neon Postgres)

Schema (`lib/db/schema.ts`) has four tables:

- `User` — `id`, `naverId` (unique), `email`, `nickname`, `name`, `profileImage`, `role` (`customer` | `admin`), `createdAt`, `updatedAt`.
- `Visit` — `id`, `userId` (cascade fk), `visitedAt`, `lat`, `lng`. Indexed on `(userId, visitedAt)`. **Unique** functional index on `(userId, (visitedAt + 9h)::date)` to dedupe per KST day.
- `Book` — `id`, `isbn` (unique), `title`, `author`, `publisher`, `publishDate`, `coverImageUrl`, `description`, `kdc`, **`ownerComment`** (책방지기 post-it text), `addedByUserId` (set null on user delete), `fetchedAt`, `createdAt`.
- `Record` — `id`, `userId` (cascade fk), `bookId` (cascade fk), `content`, `createdAt`, `updatedAt`. Indexed on `createdAt`, `userId`, `bookId`.

**Connection URL**: `lib/db/connection.ts` `getPostgresUrl()` reads `BENSLIB_POSTGRES_URL` first (Vercel Neon integration), falls back to `POSTGRES_URL` (local `.env.local`). With `preferUnpooled: true`, promotes the `*_NON_POOLING` variants — DDL should not go through pgbouncer.

Runtime queries use `drizzle-orm/neon-http` (HTTP, no persistent connection). The migrator uses `postgres-js` (TCP, needed for DDL transactions).

Migrations 0000–0008 are leftovers from the Chat SDK era and create the now-defunct tables; `0012_drop_legacy_chat_tables.sql` drops them. Current schema migrations start at `0009_naver_user.sql` and run through `0018_visit_unique_kst_day.sql`.

### Cover storage (Vercel Blob)

`lib/cover-storage.ts` exposes:
- `uploadCoverBytes(isbn, buffer, contentType)` — direct upload (admin file picker).
- `fetchAndUploadCover(isbn, sourceUrl)` — fetch external URL, validate (image, ≥5KB), upload. Used by admin add (`/admin/books/new`) and the backfill/retry scripts.

All covers live at `covers/{isbn}.{ext}` in the public Blob store; `Book.coverImageUrl` stores the public Blob URL. The app no longer hits NL for cover images at runtime.

### Geolocation + KST time

`lib/geo.ts`:
- `haversineMeters(a, b)` — distance check in `/api/visits`.
- KST helpers (`kstDateStamp`, `kstDayBounds`, `kstMonthBounds`) — all "today" / "this month" logic runs in Asia/Seoul regardless of serverless region.

`STORE_LAT`, `STORE_LNG`, `STORE_RADIUS_M` live in `lib/constants.ts`. **STORE_LAT/LNG throw at module load if missing in production** — silently falling back to a placeholder would reject every check-in. Dev/test get a Seoul placeholder.

### Book catalog + NL API

`lib/nat-lib.ts` wraps 국립중앙도서관 `seoji/SearchApi.do`:
- `lookupBookByIsbn(isbn)` — ISBN → full metadata (used by `/admin/books/new` add flow and backfill scripts).
- `searchBooks({ title, author, limit })` — title/author → candidate list with ISBNs (used by `/admin/books/new` search).

`docs/NAT_LIB_API.md` is the full API reference.

### Next 16 cacheComponents

`next.config.ts` sets `cacheComponents: true`. Uncached data (async server components, `useSearchParams`, `useSession`, dynamic route params) must live inside `<Suspense>` boundaries. Every dynamic route follows:

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PageContent />
    </Suspense>
  );
}
```

`bodySizeLimit: "4mb"` is set on `experimental.serverActions` to allow cover uploads.

### Caching

`lib/cached-queries.ts` wraps the read-mostly queries with `unstable_cache`:
- `cachedListBooks` (10 min, tag `books`)
- `cachedGetBookByIsbn` (10 min, tag `books`)
- `cachedListRecords` (30 s, tag `records`)
- `cachedListRecordsForBook` (30 s, tag `records`)

Mutations in `app/admin/books/**/actions.ts` and `app/records/actions.ts` call `revalidatePath` + `updateTag` to bust them. Book edits should also invalidate the `records` tag because joined book fields (title, coverImageUrl) appear in the cached record cards.

### Components

- `components/bottom-nav.tsx` — bottom nav for `/me`, `/records`, `/books`, `/books/[isbn]`, `/records/new`. Two tabs: 기록 / 내정보(or 로그인).
- `components/auto-check-in.tsx` — geolocation + `/api/visits` POST + status pill. Mounted on `/me` and on the needs-check-in gate prompt. Retries on visibility change (walking into store with tab open).
- `components/admin-header.tsx` — sticky horizontal admin nav with back link + 도서/기록 tabs. Used by every `/admin/**` page.
- `components/board-gate-prompt.tsx` — `AnonymousBoardPrompt` + `NeedsCheckInPrompt` for the gate.

### Favicon

`app/icon.png` and `app/apple-icon.png` (Next 16 app-icon convention). Same image is also at `public/logo.png` for OG/header use.

## Tooling notes

- **Lint via Ultracite/Biome** is pinned: `@biomejs/biome` 2.3.11 + `ultracite` 7.0.11. Don't auto-upgrade either without testing together.
- **Tailwind CSS v4** with `@tailwindcss/postcss`. `app/globals.css` is the entry. No shadcn/ui — plain Tailwind on `bg-black text-white`.
- **OpenTelemetry** wired in `instrumentation.ts` via `@vercel/otel` (`serviceName: "bens-library"`).
- **`@vercel/analytics`** mounted in `app/layout.tsx` for page views.
- **Vercel region** pinned to `icn1` (Seoul) via `vercel.json`.

## Required env vars

See `.env.example`. In Vercel production:

- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — `developers.naver.com/apps`, callback `https://<domain>/api/auth/callback/naver`
- `NAT_LIB_API_KEY` — 국립중앙도서관 Open API key (server-only)
- `BENSLIB_POSTGRES_URL` + `BENSLIB_POSTGRES_URL_NON_POOLING` — auto-provisioned by the Vercel Neon integration when set up with prefix `BENSLIB_`
- `BLOB_READ_WRITE_TOKEN` — auto-provisioned when the project is linked to a public Vercel Blob store
- `STORE_LAT`, `STORE_LNG` — **required**, build will fail without them. Currently `37.5597269`, `126.8317699` (강서구 공항대로 219).
- Optional: `STORE_RADIUS_M` (default 100)
