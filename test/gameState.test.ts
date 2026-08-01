import { describe, it, expect } from "vitest";
import { GameState, isAboveDangerLine } from "../src/core/gameState";
import { FRUITS, MAX_LEVEL } from "../src/core/fruits";

describe("GameState", () => {
  it("初期状態は score/best 0・not over", () => {
    const g = new GameState();
    expect(g.score).toBe(0);
    expect(g.best).toBe(0);
    expect(g.isOver).toBe(false);
  });

  it("合体でスコアが加算され、次段階を返す", () => {
    const g = new GameState();
    const out = g.resolveMerge(0, 0);
    expect(out.producedLevel).toBe(1);
    expect(out.gainedScore).toBe(FRUITS[1].score);
    expect(g.score).toBe(FRUITS[1].score);
  });

  it("スイカ同士は producedLevel=null（消滅）", () => {
    const g = new GameState();
    const out = g.resolveMerge(MAX_LEVEL, MAX_LEVEL);
    expect(out.producedLevel).toBeNull();
    expect(g.score).toBe(FRUITS[MAX_LEVEL].score * 2);
  });

  it("異なる段階の合体は例外", () => {
    const g = new GameState();
    expect(() => g.resolveMerge(1, 2)).toThrow(/different levels/);
  });

  it("end() でゲームオーバー・ベスト更新", () => {
    const g = new GameState();
    g.resolveMerge(2, 2);
    const scored = g.score;
    g.end();
    expect(g.isOver).toBe(true);
    expect(g.best).toBe(scored);
  });

  it("end() は冪等（2回呼んでもベストが崩れない）", () => {
    const g = new GameState();
    g.resolveMerge(2, 2);
    g.end();
    const best = g.best;
    g.end();
    expect(g.best).toBe(best);
  });

  it("ゲームオーバー後の合体は例外", () => {
    const g = new GameState();
    g.end();
    expect(() => g.resolveMerge(0, 0)).toThrow(/after game over/);
  });

  it("reset() で score=0・over解除、ベストは保持", () => {
    const g = new GameState();
    g.resolveMerge(3, 3);
    const scored = g.score;
    g.end();
    g.reset();
    expect(g.score).toBe(0);
    expect(g.isOver).toBe(false);
    expect(g.best).toBe(scored);
  });

  it("reset() は end() なしでもベストを反映", () => {
    const g = new GameState();
    g.resolveMerge(4, 4);
    const scored = g.score;
    g.reset();
    expect(g.best).toBe(scored);
    expect(g.score).toBe(0);
  });

  it("低いスコアで reset してもベストは下がらない", () => {
    const g = new GameState();
    g.resolveMerge(5, 5); // 高スコア
    const high = g.score;
    g.reset();
    g.resolveMerge(0, 0); // 低スコア
    g.reset();
    expect(g.best).toBe(high);
  });
});

describe("isAboveDangerLine", () => {
  it("上端がライン上（y小）にあると true", () => {
    // 中心 100, 半径 30 → 上端 70。ライン 80 より上。
    expect(isAboveDangerLine(100, 30, 80)).toBe(true);
  });

  it("上端がラインより下なら false", () => {
    // 上端 70、ライン 60
    expect(isAboveDangerLine(100, 30, 60)).toBe(false);
  });

  it("ちょうど接している境界は false（未満で判定）", () => {
    // 上端 70、ライン 70
    expect(isAboveDangerLine(100, 30, 70)).toBe(false);
  });
});
