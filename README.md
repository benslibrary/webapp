# 벤의 서재 web app

A light Korean-language web app for in-store customers of **벤의 서재 (Ben's Library)**. Two product surfaces, one auth method.

- **출석체크** at `/archive` — logged-in customers tap a check-in button at the store, the browser supplies geolocation, and the server records a visit when the coordinates are within the configured radius of the store. The dashboard shows the current month (Asia/Seoul) with a green dot on every day the customer visited.
- **공용 포스트잇 게시판** at `/board`, `/board/new` — anyone can read the wall (필사 / 후기 / 메모 post-its); logged-in customers can post.
- **Naver OAuth** is the sole login method. Anonymous read is allowed on `/`, `/board`, and a few other public surfaces.

Production: <https://benslibrary.com> (Vercel, deploys from `main`).

## Tech stack

- Next.js 16 (App Router, Turbopack, `cacheComponents`) on React 19
- Drizzle ORM against Neon Postgres
- NextAuth v5 with a custom Naver OAuth provider
- Tailwind CSS v4 + a small set of shadcn/ui primitives
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
- `POSTGRES_URL` — Neon, wired in via the Vercel integration
- `STORE_LAT`, `STORE_LNG`, `STORE_RADIUS_M` — real storefront coordinates. The defaults in `lib/constants.ts` are placeholder Seoul coords, so attendance check-ins won't be meaningful until these are set.

In development, `AUTH_SECRET` falls back to a literal dev string if unset (see `lib/constants.ts`). Don't ship to production without setting it.

## Architecture quick map

- `app/page.tsx` — landing for anonymous visitors. Authed visitors are redirected to `/archive`.
- `app/(auth)/auth.ts` — NextAuth config with the custom Naver provider. The `signIn` callback upserts the user into our `User` table and rewrites `user.id` to the internal uuid before the jwt callback fires.
- `app/api/visits/route.ts` — `POST` only. Validates session, runs haversine against `STORE_LAT/LNG`, dedups by Asia/Seoul calendar day.
- `app/board/actions.ts` — server action for new posts (login required, zod-validated).
- `lib/db/schema.ts` — three tables: `User`, `Visit`, `Post`.
- `lib/geo.ts` — `haversineMeters` + KST date/month helpers.
- `proxy.ts` — Next middleware substitute. Currently just a `/ping` passthrough; auth gating happens at route/action level.

`CLAUDE.md` has the deeper architectural notes (cacheComponents patterns, the Naver provider flow, migration history, the few intentional pinned versions).
