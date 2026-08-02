import { describe, it, expect } from "vitest";
import {
  FRUITS,
  MAX_LEVEL,
  DROP_MAX_LEVEL,
  getFruit,
  nextLevel,
  canMerge,
  randomDropLevel,
  parseDropSequence,
} from "../src/core/fruits";

describe("FRUITS テーブル", () => {
  it("11段階（さくらんぼ〜スイカ）ある", () => {
    expect(FRUITS).toHaveLength(11);
    expect(FRUITS[0].name).toBe("さくらんぼ");
    expect(FRUITS[MAX_LEVEL].name).toBe("スイカ");
  });

  it("level は 0 から連番", () => {
    FRUITS.forEach((f, i) => expect(f.level).toBe(i));
  });

  it("半径は段階が上がるほど単調増加", () => {
    for (let i = 1; i < FRUITS.length; i++) {
      expect(FRUITS[i].radius).toBeGreaterThan(FRUITS[i - 1].radius);
    }
  });

  it("スコアは三角数 (1,3,6,10,...)", () => {
    expect(FRUITS.map((f) => f.score).slice(0, 5)).toEqual([1, 3, 6, 10, 15]);
  });
});

describe("getFruit", () => {
  it("正しい段階の定義を返す", () => {
    expect(getFruit(0).emoji).toBe("🍒");
    expect(getFruit(MAX_LEVEL).emoji).toBe("🍉");
  });

  it("範囲外は RangeError（メッセージに段階を含む）", () => {
    expect(() => getFruit(-1)).toThrow(/invalid fruit level: -1/);
    expect(() => getFruit(MAX_LEVEL + 1)).toThrow(RangeError);
  });
});

describe("nextLevel", () => {
  it("通常段階は +1", () => {
    expect(nextLevel(0)).toBe(1);
    expect(nextLevel(MAX_LEVEL - 1)).toBe(MAX_LEVEL);
  });

  it("最大段階は null（消滅）", () => {
    expect(nextLevel(MAX_LEVEL)).toBeNull();
  });

  it("範囲外は RangeError（メッセージに段階を含む）", () => {
    expect(() => nextLevel(-1)).toThrow(/invalid fruit level: -1/);
    expect(() => nextLevel(MAX_LEVEL + 1)).toThrow(/invalid fruit level/);
  });
});

describe("canMerge", () => {
  it("同段階は合体可", () => {
    expect(canMerge(3, 3)).toBe(true);
  });

  it("異なる段階は合体不可", () => {
    expect(canMerge(2, 3)).toBe(false);
  });
});

describe("randomDropLevel", () => {
  it("常に 0..DROP_MAX_LEVEL の範囲に収まる", () => {
    for (let i = 0; i <= 20; i++) {
      const lvl = randomDropLevel(() => i / 21);
      expect(lvl).toBeGreaterThanOrEqual(0);
      expect(lvl).toBeLessThanOrEqual(DROP_MAX_LEVEL);
    }
  });

  it("rng=0 は最小、rng→1 は最大候補", () => {
    expect(randomDropLevel(() => 0)).toBe(0);
    expect(randomDropLevel(() => 0.999)).toBe(DROP_MAX_LEVEL);
  });

  it("引数なしでも動く（既定は Math.random）", () => {
    const lvl = randomDropLevel();
    expect(lvl).toBeGreaterThanOrEqual(0);
    expect(lvl).toBeLessThanOrEqual(DROP_MAX_LEVEL);
  });
});

describe("parseDropSequence", () => {
  it("null / 空文字列は空配列", () => {
    expect(parseDropSequence(null)).toEqual([]);
    expect(parseDropSequence(undefined)).toEqual([]);
    expect(parseDropSequence("")).toEqual([]);
  });

  it("カンマ区切りを段階の配列に変換する", () => {
    expect(parseDropSequence("0,0,3")).toEqual([0, 0, 3]);
  });

  it("前後の空白を許容する", () => {
    expect(parseDropSequence(" 1 , 2 ")).toEqual([1, 2]);
  });

  it("範囲外・非整数・非数値は除外する", () => {
    expect(parseDropSequence("0,-1,99,1.5,abc,2")).toEqual([0, 2]);
  });

  it("最大段階（スイカ）まで許容する", () => {
    expect(parseDropSequence(String(MAX_LEVEL))).toEqual([MAX_LEVEL]);
    expect(parseDropSequence(String(MAX_LEVEL + 1))).toEqual([]);
  });
});
