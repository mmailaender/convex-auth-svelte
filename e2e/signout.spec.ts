import { test } from "@playwright/test";

test("signout works", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Secret").fill(process.env.AUTH_E2E_TEST_SECRET!);
  await page.getByRole("button").getByText("Sign in with secret").click();
  await page.waitForURL("/product");

  await page.locator("#user-menu-trigger").click();
  await page.getByRole("button").getByText("Sign out").click();
});
