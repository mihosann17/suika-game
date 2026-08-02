import { describe, it, expect } from "vitest";
import { GameState, isAboveDangerLine, isOverflowing, isSettled } from "../src/core/gameState";
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

describe("isAboveDangerLine（フルーツの上端が危険ラインを越えているか）", () => {
  it("上端が危険ラインより上（y が小さい側）にあるとき、越えていると判定する", () => {
    // 中心 100・半径 30 → 上端 70。危険ライン 80 よりさらに上にある。
    expect(isAboveDangerLine(100, 30, 80)).toBe(true);
  });

  it("上端が危険ラインより下にあるとき、越えていないと判定する", () => {
    // 上端 70 に対し危険ライン 60。フルーツはライン下に収まっている。
    expect(isAboveDangerLine(100, 30, 60)).toBe(false);
  });

  it("上端が危険ラインにちょうど接しているときは、まだ越えていないと判定する", () => {
    // 上端 70 = 危険ライン 70。「未満」で判定するため接触は越境に含めない。
    expect(isAboveDangerLine(100, 30, 70)).toBe(false);
  });
});

describe("isSettled（フルーツが盤上に落ち着いたか）", () => {
  const THRESHOLD = 0.8;

  it("速度が閾値より小さいとき、落ち着いた（静止した）と判定する", () => {
    expect(isSettled(0.1, THRESHOLD)).toBe(true);
  });

  it("速度が閾値より大きいとき、まだ動いている（落下・跳ね返り中）と判定する", () => {
    expect(isSettled(5, THRESHOLD)).toBe(false);
  });

  it("速度が閾値と等しい境界のフルーツは、落ち着いた側に含めて判定する", () => {
    // 判定は「閾値以下」。境界値は静止扱いにするという仕様。
    expect(isSettled(THRESHOLD, THRESHOLD)).toBe(true);
  });
});

describe("isOverflowing（盤面が危険ラインを越えてあふれているか）", () => {
  const LINE = 80;
  const THRESHOLD = 0.8;

  it("フルーツが1つも無いとき、あふれていないと判定する", () => {
    expect(isOverflowing([], LINE, THRESHOLD)).toBe(false);
  });

  it("落ち着いたフルーツが危険ラインを越えているとき、あふれていると判定する", () => {
    // 上端 70 (< 80) で越境、速度 0.1 (<= 0.8) で静止。ゲームオーバー条件を満たす。
    expect(isOverflowing([{ centerY: 100, radius: 30, speed: 0.1 }], LINE, THRESHOLD)).toBe(true);
  });

  it("危険ラインを越えていても、まだ落下中（高速）のフルーツはあふれと数えない", () => {
    // 上端 70 で越境しているが速度 5 (> 0.8)。投下直後の一時的な通過なので対象外。
    expect(isOverflowing([{ centerY: 100, radius: 30, speed: 5 }], LINE, THRESHOLD)).toBe(false);
  });

  it("落ち着いていても危険ラインより下に収まっていれば、あふれていないと判定する", () => {
    // 上端 90 (>= 80) でライン下。静止していても越境していないため対象外。
    expect(isOverflowing([{ centerY: 120, radius: 30, speed: 0 }], LINE, THRESHOLD)).toBe(false);
  });

  it("あふれているフルーツが1つでもあれば、他が安全でも全体としてあふれと判定する", () => {
    expect(
      isOverflowing(
        [
          { centerY: 300, radius: 20, speed: 0 }, // ライン下に収まっている
          { centerY: 90, radius: 30, speed: 0.2 }, // 越境かつ静止 → これが決め手
        ],
        LINE,
        THRESHOLD,
      ),
    ).toBe(true);
  });
});
