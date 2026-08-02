import { describe, it, expect } from "vitest";
import { BOARD_WIDTH, BOARD_HEIGHT, DANGER_LINE_Y, DROP_Y, clampDropX } from "../src/core/board";

describe("盤面定数", () => {
  it("危険ラインは落下待機位置より下にある", () => {
    expect(DROP_Y).toBeLessThan(DANGER_LINE_Y);
  });

  it("盤面サイズは正の値", () => {
    expect(BOARD_WIDTH).toBeGreaterThan(0);
    expect(BOARD_HEIGHT).toBeGreaterThan(0);
  });
});

describe("clampDropX", () => {
  it("範囲内の x はそのまま返す", () => {
    expect(clampDropX(180, 15)).toBe(180);
  });

  it("左にはみ出す x は radius に収める", () => {
    expect(clampDropX(0, 15)).toBe(15);
    expect(clampDropX(-100, 20)).toBe(20);
  });

  it("右にはみ出す x は width - radius に収める", () => {
    expect(clampDropX(BOARD_WIDTH, 15)).toBe(BOARD_WIDTH - 15);
    expect(clampDropX(9999, 20)).toBe(BOARD_WIDTH - 20);
  });

  it("境界値ちょうどはそのまま", () => {
    expect(clampDropX(15, 15)).toBe(15);
    expect(clampDropX(BOARD_WIDTH - 15, 15)).toBe(BOARD_WIDTH - 15);
  });

  it("width を指定できる", () => {
    expect(clampDropX(1000, 10, 200)).toBe(190);
    expect(clampDropX(-5, 10, 200)).toBe(10);
  });

  it("フルーツが盤面より大きい異常系では中央を返す", () => {
    // 2*radius > width → min(=radius) > max(=width-radius)
    expect(clampDropX(50, 120, 200)).toBe(100);
  });
});
