import { expect, test } from "@playwright/test";

// Smoke tests intentionally skip routes that touch the database — CI
// runs without POSTGRES_URL. Add DB-backed tests in a separate suite
// once a CI Postgres is wired up.

test.describe("smoke", () => {
  test("/ping route responds with pong", async ({ request }) => {
    const res = await request.get("/ping");
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("pong");
  });

  test("login page renders Naver button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("네이버로 로그인")).toBeVisible();
  });

  test("anonymous landing shows login CTA, no stamp UI", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "시작하기" })).toBeVisible();
    await expect(page.getByText("매장에 방문 후 로그인")).toBeVisible();
    // The legacy mock 4-step flow (Opening / Onboarding / StampCard /
    // Dashboard) must not be reachable from / for anonymous visitors.
    await expect(page.getByText("Stamp Card")).not.toBeVisible();
  });
});
