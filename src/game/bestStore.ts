/**
 * ベストスコアの永続化（localStorage）。
 * core（GameState）は DOM 非依存の純粋ロジックのため、ブラウザ API に触れる
 * 保存/読込はこのゲーム層に置く。ストレージが使えない環境（プライベートモード・
 * 無効化）でも例外を投げず、読込は 0・保存は no-op にフォールバックする。
 */

/** localStorage に保存する際のキー。 */
export const BEST_KEY = "suika:best";

/** 読込に必要な最小インターフェース（テストで差し替え可能にするための seam）。 */
type Readable = Pick<Storage, "getItem">;
/** 保存に必要な最小インターフェース。 */
type Writable = Pick<Storage, "setItem">;

/**
 * 保存済みのベストスコアを読み込む。
 * 未保存・不正値・ストレージ不可のいずれの場合も 0 を返す。
 * @param storage 読込元（既定は localStorage）
 */
export function loadBest(storage: Readable = localStorage): number {
  try {
    const raw = storage.getItem(BEST_KEY);
    if (raw === null) {
      return 0;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/**
 * ベストスコアを保存する。負値・小数は 0 以上の整数に丸める。
 * ストレージが使えない環境では何もしない（プレイは継続できる）。
 * @param best 保存するベストスコア
 * @param storage 保存先（既定は localStorage）
 */
export function saveBest(best: number, storage: Writable = localStorage): void {
  try {
    storage.setItem(BEST_KEY, String(Math.max(0, Math.floor(best))));
  } catch {
    // 保存不可環境では黙って諦める。
  }
}
