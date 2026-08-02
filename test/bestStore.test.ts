import { describe, it, expect } from "vitest";
import { BEST_KEY, loadBest, saveBest } from "../src/game/bestStore";

/** localStorage 互換の最小フェイク。DOM 非依存でテストするための seam。 */
function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string): string | null => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
    map,
  };
}

/** getItem / setItem が必ず例外を投げるストレージ（ストレージ不可環境の模擬）。 */
const throwingStorage = {
  getItem(): string | null {
    throw new Error("storage disabled");
  },
  setItem(): void {
    throw new Error("storage disabled");
  },
};

describe("loadBest", () => {
  it("未保存（null）のときは 0 を返す", () => {
    expect(loadBest(fakeStorage())).toBe(0);
  });

  it("保存済みの数値文字列を数値として読み込む", () => {
    expect(loadBest(fakeStorage({ [BEST_KEY]: "4200" }))).toBe(4200);
  });

  it("小数は整数に丸める", () => {
    expect(loadBest(fakeStorage({ [BEST_KEY]: "99.9" }))).toBe(99);
  });

  it("不正値（数値でない）は 0 を返す", () => {
    expect(loadBest(fakeStorage({ [BEST_KEY]: "abc" }))).toBe(0);
  });

  it("負値は 0 を返す", () => {
    expect(loadBest(fakeStorage({ [BEST_KEY]: "-1" }))).toBe(0);
  });

  it("読込が例外を投げても 0 にフォールバックする", () => {
    expect(loadBest(throwingStorage)).toBe(0);
  });
});

describe("saveBest", () => {
  it("ベストスコアを文字列として保存する", () => {
    const s = fakeStorage();
    saveBest(4200, s);
    expect(s.map.get(BEST_KEY)).toBe("4200");
  });

  it("負値は 0 に丸めて保存する", () => {
    const s = fakeStorage();
    saveBest(-10, s);
    expect(s.map.get(BEST_KEY)).toBe("0");
  });

  it("小数は整数に丸めて保存する", () => {
    const s = fakeStorage();
    saveBest(12.7, s);
    expect(s.map.get(BEST_KEY)).toBe("12");
  });

  it("保存が例外を投げても外に伝播しない", () => {
    expect(() => saveBest(100, throwingStorage)).not.toThrow();
  });

  it("save した値を load で往復できる", () => {
    const s = fakeStorage();
    saveBest(777, s);
    expect(loadBest(s)).toBe(777);
  });
});
