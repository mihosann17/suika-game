import { describe, it, expect } from "vitest";
import { mergeScore } from "../src/core/scoring";
import { FRUITS, MAX_LEVEL } from "../src/core/fruits";

describe("mergeScore", () => {
  it("通常合体は合体後の段階のスコア", () => {
    // level0 同士 → level1 (score 3)
    expect(mergeScore(0)).toBe(FRUITS[1].score);
    expect(mergeScore(3)).toBe(FRUITS[4].score);
  });

  it("スイカ同士はスコア2倍のボーナス", () => {
    expect(mergeScore(MAX_LEVEL)).toBe(FRUITS[MAX_LEVEL].score * 2);
  });

  it("範囲外は RangeError（メッセージに段階を含む）", () => {
    expect(() => mergeScore(-1)).toThrow(/invalid fruit level: -1/);
    expect(() => mergeScore(MAX_LEVEL + 1)).toThrow(/invalid fruit level/);
  });
});
