import { test, expect } from "@playwright/test";

/**
 * 大きくて合体しないフルーツ（スイカ→メロン→…）を中央に積み上げ、
 * 危険ラインを越えてゲームオーバーになること、「もう一度」で再開できることを確認する。
 * ?seq=10,9,8,7,6 で投下順を固定し、乱数・合体に依存しない決定的なテストにする。
 * 各段は隣接しないので合体せず、縦に積み上がって必ずラインを越える。
 */
test("危険ライン越えでゲームオーバー→リスタートで再開できる", async ({ page }) => {
  // 大玉を1つずつ落として静止を待つため時間がかかる。
  test.setTimeout(90_000);

  await page.goto("/?seq=10,9,8,7,6");

  const canvas = page.locator("#game-canvas");
  const gameover = page.locator("#gameover");
  const score = page.locator("#score");

  await expect(canvas).toBeVisible();
  await expect(gameover).toBeHidden();

  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("canvas の座標を取得できません");
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.3;

  // 中央へ 1 つずつ落とし、次を落とす前に落下・静止を待つ（重なりによる弾きを防ぐ）。
  async function stackFruits(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(1400);
    }
  }

  await stackFruits(5);

  // 猶予(1200ms)経過後にゲームオーバー表示。
  await expect(gameover).toBeVisible({ timeout: 15000 });

  // 「もう一度」で盤面リセット・スコア 0・オーバーレイ非表示。
  await page.locator("#restart").click();
  await expect(gameover).toBeHidden();
  await expect(score).toHaveText("0");

  // 再開後もループが動いていることを、同じ手順でもう一度ゲームオーバーにして確認。
  await stackFruits(5);
  await expect(gameover).toBeVisible({ timeout: 15000 });
});
