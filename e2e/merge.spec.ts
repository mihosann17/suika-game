import { test, expect } from "@playwright/test";

/**
 * 同じ段階のフルーツを2つ投下すると合体してスコアが増えることを確認する。
 * ?seq=0 で投下順をさくらんぼ固定にし、乱数に依存しない決定的なテストにする。
 */
test("同段フルーツの投下で合体しスコアが増える", async ({ page }) => {
  await page.goto("/?seq=0");

  const canvas = page.locator("#game-canvas");
  await expect(canvas).toBeVisible();
  await expect(page.locator("#score")).toHaveText("0");

  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("canvas の座標を取得できません");
  }
  // 盤面中央の同じ x へ2つ投下（重なって落ち、接触して合体する）。
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.3;

  await page.mouse.click(x, y);
  // 投下クールダウン(500ms)より長く待ってから2つ目を投下。
  await page.waitForTimeout(700);
  await page.mouse.click(x, y);

  // 落下→接触→合体でスコアが 0 から増える。
  await expect(page.locator("#score")).not.toHaveText("0", { timeout: 5000 });
});
