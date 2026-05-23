# 벤의 서재 web app

A light Korean-language web app for in-store customers of **벤의 서재 (Ben's Library)**. Three product surfaces, one auth method.

- **출석체크** at `/archive` — logged-in customers tap the check-in button at the store; the browser supplies geolocation; the server records a visit when the coordinates are within the configured radius of the store. The dashboard shows the current month (Asia/Seoul) with a green dot on every day the customer visited.
- **도서관** at `/books`, `/books/[isbn]` — public catalog of books the store stocks. The catalog is operator-curated via `/admin/books` (admin role only); metadata is fetched from the **국립중앙도서관 Open API** by ISBN and cached locally.
- **기록** at `/records`, `/records/new` — anyone can read the latest 독서 감상 entries; logged-in customers can write new ones. Each entry is tied to a specific book in the catalog. Users edit / delete their own entries from `/me`.
- **Naver OAuth** is the sole login method. Anonymous read is allowed on `/`, `/records`, `/books`, `/books/[isbn]`.

Production: <https://benslibrary.com> (Vercel, deploys from `main`).

## Tech stack

- Next.js 16 (App Router, Turbopack, `cacheComponents`) on React 19
- Drizzle ORM against Neon Postgres
- NextAuth v5 with a custom Naver OAuth provider
- Tailwind CSS v4 (no shadcn primitives — every surface is plain Tailwind)
- Biome (via Ultracite) for lint/format
- Playwright for smoke tests

## Running locally

Requires **pnpm 9.12.3** (see `packageManager`).

```bash
pnpm install
cp .env.example .env.local  # then fill in the values below
pnpm db:migrate              # apply migrations to your Postgres
pnpm dev                     # http://localhost:3000
```

Other useful scripts:

| Command | What |
| --- | --- |
| `pnpm build` | Runs migrations, then `next build` |
| `pnpm build:vercel` | `next build` only (skips migrations) |
| `pnpm lint` | Biome via Ultracite |
| `pnpm format` | Auto-fix lint/format |
| `pnpm test` | Playwright smoke suite (`tests/e2e/*.test.ts`) |
| `pnpm db:generate` | Generate a new migration from `lib/db/schema.ts` |
| `pnpm db:studio` | Drizzle Studio |

## Environment variables

See `.env.example`. Required in production:

- `AUTH_SECRET` — `openssl rand -base64 32`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — register an app at <https://developers.naver.com/apps> with callback URL `https://<domain>/api/auth/callback/naver`
- `NAT_LIB_API_KEY` — 국립중앙도서관 Open API key, used by the admin book lookup (see `docs/NAT_LIB_API.md`)
- `BENSLIB_POSTGRES_URL` — set automatically by the Vercel Neon integration (we use the `BENSLIB_` prefix); locally fall back to `POSTGRES_URL`
- `STORE_LAT`, `STORE_LNG`, `STORE_RADIUS_M` — real storefront coordinates. Defaults in `lib/constants.ts` are placeholder Seoul coords; attendance check-ins won't be meaningful until these are set.

In development, `AUTH_SECRET` falls back to a literal dev string if unset (see `lib/constants.ts`). Don't ship to production without setting it.

## Architecture quick map

- `app/page.tsx` — landing for anonymous visitors. Authed visitors are redirected to `/archive`.
- `app/(auth)/auth.ts` — NextAuth config with the custom Naver provider. The `signIn` callback upserts the user into our `User` table and rewrites `user.id` to the internal uuid before the jwt callback fires.
- `app/archive/page.tsx` — attendance dashboard.
- `app/api/visits/route.ts` — `POST` only. Validates session, runs haversine against `STORE_LAT/LNG`, dedups by Asia/Seoul calendar day.
- `app/admin/books/` — admin ISBN registration UI + server action. Server proxies to `lib/nat-lib.ts`. Gated by `requireAdmin()` from `lib/auth-helpers.ts`.
- `app/books/`, `app/books/[isbn]/` — public catalog read.
- `app/records/`, `app/records/new/` — record list + write. Server actions in `app/records/actions.ts` cover create / update / delete.
- `app/me/` — profile page. Editable nickname, list of user's own records with inline edit + delete, sign out.
- `lib/db/schema.ts` — four tables: `User`, `Visit`, `Book`, `Record`.
- `lib/geo.ts` — `haversineMeters` + Asia/Seoul date helpers.
- `lib/nat-lib.ts` — 국립중앙도서관 Open API client (currently only the ISBN bibliographic endpoint).
- `proxy.ts` — Next middleware substitute. Currently a `/ping` passthrough; auth gating happens at route/action level.

`CLAUDE.md` has the deeper architectural notes (cacheComponents patterns, the Naver provider flow, migration history, the few intentional pinned versions, operator bootstrap steps).
