/** スコア計算の純粋関数。 */
import { FRUITS, MAX_LEVEL } from "./fruits";

/**
 * 段階 `level` のフルーツ2つが合体したときの獲得スコア。
 * 通常は「合体後の段階のスコア」。最大段階（スイカ）同士はクリア扱いで大きめのボーナス。
 */
export function mergeScore(level: number): number {
  if (level < 0 || level > MAX_LEVEL) {
    throw new RangeError(`invalid fruit level: ${level}`);
  }
  if (level === MAX_LEVEL) {
    // スイカ同士の合体はボードから消え、特別ボーナスを得る
    return FRUITS[MAX_LEVEL].score * 2;
  }
  return FRUITS[level + 1].score;
}
