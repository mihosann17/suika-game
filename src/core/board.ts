/**
 * 盤面の寸法・座標に関する純粋な定義とヘルパー。
 * Matter.js / DOM に依存しない（テスト対象の核）。
 * 画面座標系では y が小さいほど上。
 */

/** 盤面（キャンバス）の幅 (px)。左右の壁の内側がちょうど 0 と WIDTH。 */
export const BOARD_WIDTH = 360;
/** 盤面（キャンバス）の高さ (px)。床の上端がちょうど HEIGHT。 */
export const BOARD_HEIGHT = 480;
/** ゲームオーバー判定に使う危険ラインの y。 */
export const DANGER_LINE_Y = 84;
/** 落下前のフルーツが待機する中心 y（危険ラインより上）。 */
export const DROP_Y = 40;

/**
 * 落下位置の x を、フルーツが壁を突き抜けない範囲に収める。
 * @param x 希望する中心 x
 * @param radius フルーツ半径
 * @param width 盤面幅（既定は BOARD_WIDTH）
 * @returns [radius, width - radius] にクランプした中心 x
 */
export function clampDropX(x: number, radius: number, width: number = BOARD_WIDTH): number {
  const min = radius;
  const max = width - radius;
  // フルーツが盤面より大きい異常系では中央に置く。
  if (min > max) {
    return width / 2;
  }
  if (x < min) {
    return min;
  }
  if (x > max) {
    return max;
  }
  return x;
}
