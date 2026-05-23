export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

/** Fallback for dev when AUTH_SECRET is not set; do not use in production. */
export const AUTH_SECRET_OR_DEV_FALLBACK =
  process.env.AUTH_SECRET ||
  (isDevelopmentEnvironment
    ? "dev-secret-minimum-32-characters-long"
    : undefined);

/**
 * Storefront coordinates used to validate attendance check-ins. On
 * Vercel these MUST be set in project settings — silently falling back
 * to a placeholder would reject every customer's check-in. We throw
 * when running on Vercel without the env (build or runtime) so the
 * misconfiguration surfaces immediately. Local dev/build (no VERCEL
 * env var) gets a Seoul placeholder.
 */
function requireCoord(
  name: "STORE_LAT" | "STORE_LNG",
  raw: string | undefined
): number {
  if (raw === undefined || raw === "") {
    if (process.env.VERCEL === "1") {
      throw new Error(
        `${name} env var is required on Vercel. Set it in project settings.`
      );
    }
    // Placeholder: 서울시청 — local dev/build/test only.
    return name === "STORE_LAT" ? 37.5665 : 126.978;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`${name} must be a number (got "${raw}")`);
  }
  return n;
}

export const STORE_LAT = requireCoord("STORE_LAT", process.env.STORE_LAT);
export const STORE_LNG = requireCoord("STORE_LNG", process.env.STORE_LNG);
export const STORE_RADIUS_M = Number(process.env.STORE_RADIUS_M ?? "100");
