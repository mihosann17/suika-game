import { test, expect } from "@playwright/test";

test("トップページが読み込まれ、ゲーム盤が表示される", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("スイカゲーム");
  await expect(page.locator("#game-canvas")).toBeVisible();

  // 初期スコアは 0
  await expect(page.locator("#score")).toHaveText("0");
});
