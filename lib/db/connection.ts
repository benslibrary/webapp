/**
 * Picks the Postgres connection string. Neon's Vercel integration
 * prefixes its env vars (we set the prefix to `BENSLIB_`), so production
 * lookups go through `BENSLIB_*`. Local dev and CI can keep using the
 * unprefixed `POSTGRES_URL` in `.env.local`.
 *
 * Prefer the non-pooled URL when explicitly requested (migrations want
 * direct connections, not pgbouncer pooled ones).
 */
export function getPostgresUrl({
  preferUnpooled = false,
}: {
  preferUnpooled?: boolean;
} = {}): string | undefined {
  if (preferUnpooled) {
    return (
      process.env.BENSLIB_POSTGRES_URL_NON_POOLING ??
      process.env.BENSLIB_DATABASE_URL_UNPOOLED ??
      process.env.BENSLIB_POSTGRES_URL ??
      process.env.POSTGRES_URL
    );
  }
  return process.env.BENSLIB_POSTGRES_URL ?? process.env.POSTGRES_URL;
}
