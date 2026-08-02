/**
 * ゲーム進行の状態機械（スコア・ゲームオーバー）。
 * Matter.js / DOM に依存しない純粋なロジックのみを持つ。
 */
import { canMerge, nextLevel } from "./fruits";
import { mergeScore } from "./scoring";

/** 合体の結果。 */
export interface MergeOutcome {
  /** 合体で生まれた段階。最大段階同士の消滅なら null。 */
  producedLevel: number | null;
  /** この合体で得たスコア。 */
  gainedScore: number;
}

export class GameState {
  private _score = 0;
  private _best = 0;
  private _over = false;

  get score(): number {
    return this._score;
  }

  get best(): number {
    return this._best;
  }

  get isOver(): boolean {
    return this._over;
  }

  /**
   * 同じ段階の2つを合体させ、スコアを加算する。
   * @throws 合体できない組み合わせ、またはゲームオーバー後の呼び出し
   */
  resolveMerge(levelA: number, levelB: number): MergeOutcome {
    if (this._over) {
      throw new Error("cannot merge after game over");
    }
    if (!canMerge(levelA, levelB)) {
      throw new Error(`cannot merge different levels: ${levelA} and ${levelB}`);
    }
    const gained = mergeScore(levelA);
    this._score += gained;
    return { producedLevel: nextLevel(levelA), gainedScore: gained };
  }

  /** ゲームオーバーにする。ベストスコアを更新する。 */
  end(): void {
    if (this._over) {
      return;
    }
    this._over = true;
    this.updateBest();
  }

  /** スコアを0に戻して再開する。ベストは保持する。 */
  reset(): void {
    this.updateBest();
    this._score = 0;
    this._over = false;
  }

  /** 現在スコアがベストを上回っていればベストを更新する。 */
  private updateBest(): void {
    this._best = Math.max(this._best, this._score);
  }
}

/**
 * フルーツの上端が危険ラインより上にあるか（＝越えている）を判定する純粋関数。
 * 画面座標系では y が小さいほど上。
 * @param fruitCenterY フルーツ中心の y
 * @param radius フルーツ半径
 * @param dangerLineY 危険ラインの y
 */
export function isAboveDangerLine(
  fruitCenterY: number,
  radius: number,
  dangerLineY: number,
): boolean {
  return fruitCenterY - radius < dangerLineY;
}

/** ゲームオーバー判定に使う、フルーツ1個分の最小情報。 */
export interface OverflowFruit {
  /** 中心 y */
  centerY: number;
  /** 半径 */
  radius: number;
  /** 速度の大きさ。落下中の一時的な越境を除外するために使う。 */
  speed: number;
}

/**
 * いずれかのフルーツが「静止した状態で危険ラインを越えている」かを判定する純粋関数。
 * 落下・跳ね返り中（speed が大きい）フルーツは一時的に越境していても除外する。
 * @param fruits 判定対象のフルーツ群
 * @param dangerLineY 危険ラインの y
 * @param speedThreshold これ以下の速度なら「静止」とみなす閾値
 */
export function isOverflowing(
  fruits: readonly OverflowFruit[],
  dangerLineY: number,
  speedThreshold: number,
): boolean {
  return fruits.some(
    (f) => f.speed <= speedThreshold && isAboveDangerLine(f.centerY, f.radius, dangerLineY),
  );
}
