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
  private _best: number;
  private _over = false;

  /**
   * @param initialBest 復元するベストスコア（永続化した値の再読み込み用）。
   *   負値・小数は 0 以上の整数に丸める。
   */
  constructor(initialBest = 0) {
    this._best = Math.max(0, Math.floor(initialBest));
  }

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

/**
 * フルーツが「静止した（盤上に落ち着いた）」状態かどうかを判定する純粋関数。
 *
 * ドメイン上、フルーツには「落下・跳ね返りで動いている最中」と「積もって落ち着いた」の
 * 2つの局面がある。この違いはフルーツ自身の振る舞い（動いているか否か）であり、
 * その判断材料が速度である。ゲームオーバー判定では「落ち着いたフルーツ」だけを
 * 対象にしたいので、この述語で局面を区別する。
 * @param speed フルーツの速度の大きさ
 * @param speedThreshold これ以下なら静止とみなす閾値
 */
export function isSettled(speed: number, speedThreshold: number): boolean {
  return speed <= speedThreshold;
}

/** ゲームオーバー判定に使う、フルーツ1個分の最小情報。 */
export interface OverflowFruit {
  /** 中心 y */
  centerY: number;
  /** 半径 */
  radius: number;
  /** 速度の大きさ。静止（落ち着いた）かどうかの判断に使う。 */
  speed: number;
}

/**
 * 盤面が「危険ラインを越えてあふれている」かを判定する純粋関数。
 *
 * ゲームオーバー条件は「積もって落ち着いたフルーツが危険ラインを越えている」こと。
 * 投下直後に危険ライン付近を高速で通過するフルーツは、まだ落ち着いていない
 * （= isSettled でない）ため対象外とし、一時的な越境で終了しないようにする。
 * @param fruits 判定対象のフルーツ群
 * @param dangerLineY 危険ラインの y
 * @param speedThreshold 静止とみなす速度の閾値（isSettled に渡す）
 */
export function isOverflowing(
  fruits: readonly OverflowFruit[],
  dangerLineY: number,
  speedThreshold: number,
): boolean {
  return fruits.some(
    (f) =>
      isSettled(f.speed, speedThreshold) && isAboveDangerLine(f.centerY, f.radius, dangerLineY),
  );
}
