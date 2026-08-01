/**
 * フルーツの進化順・見た目・当たり判定の定義と、進化に関する純粋関数。
 * このモジュールは Matter.js / DOM に一切依存しない（テスト対象の核）。
 */
export interface FruitKind {
  /** 進化段階 (0 = 最小のさくらんぼ) */
  level: number;
  /** 表示名 */
  name: string;
  /** 描画に使う絵文字 */
  emoji: string;
  /** 物理半径 (px) */
  radius: number;
  /** 円の下地色 */
  color: string;
  /** この段階に「合体して到達」したときの獲得スコア */
  score: number;
}

// さくらんぼ → いちご → ぶどう → デコポン → 柿 → りんご → 梨 → 桃 → パイナップル → メロン → スイカ
// 以下は純粋なデータ表（見た目・寸法）。ロジックではないためミューテーション対象から除外する。
// Stryker disable all
const RAW: ReadonlyArray<Omit<FruitKind, "level" | "score">> = [
  { name: "さくらんぼ", emoji: "🍒", radius: 15, color: "#e64a4a" },
  { name: "いちご", emoji: "🍓", radius: 21, color: "#f2688a" },
  { name: "ぶどう", emoji: "🍇", radius: 28, color: "#9b6fc4" },
  { name: "デコポン", emoji: "🍊", radius: 34, color: "#f6a740" },
  { name: "柿", emoji: "🟠", radius: 42, color: "#e97a2e" },
  { name: "りんご", emoji: "🍎", radius: 50, color: "#e23b3b" },
  { name: "梨", emoji: "🍐", radius: 58, color: "#bcd25a" },
  { name: "桃", emoji: "🍑", radius: 68, color: "#f7a3ae" },
  { name: "パイナップル", emoji: "🍍", radius: 78, color: "#eac645" },
  { name: "メロン", emoji: "🍈", radius: 90, color: "#a7cf6b" },
  { name: "スイカ", emoji: "🍉", radius: 104, color: "#4caf50" },
];
// Stryker restore all

/** 三角数: 合体で段階 n(0-index) を作ったときのスコア (1,3,6,10,...)。 */
function triangular(n: number): number {
  return ((n + 1) * (n + 2)) / 2;
}

export const FRUITS: readonly FruitKind[] = RAW.map((f, i) => ({
  ...f,
  level: i,
  score: triangular(i),
}));

/** 最大段階（スイカ）のインデックス。 */
export const MAX_LEVEL = FRUITS.length - 1;

/** 落下候補としてランダムに出す最大段階（小さいフルーツのみ落ちる）。 */
export const DROP_MAX_LEVEL = 4;

/** 段階を指定してフルーツ定義を得る。範囲外は例外。 */
export function getFruit(level: number): FruitKind {
  const fruit = FRUITS[level];
  if (!fruit) {
    throw new RangeError(`invalid fruit level: ${level}`);
  }
  return fruit;
}

/** 合体後の次の段階。最大段階なら null（＝消滅）。 */
export function nextLevel(level: number): number | null {
  if (level < 0 || level > MAX_LEVEL) {
    throw new RangeError(`invalid fruit level: ${level}`);
  }
  return level === MAX_LEVEL ? null : level + 1;
}

/** 2つのフルーツが合体できるか（同じ段階同士のみ）。 */
export function canMerge(a: number, b: number): boolean {
  return a === b;
}

/**
 * 落下用フルーツをランダムに選ぶ。
 * @param rng 0以上1未満を返す乱数関数（テスト時に差し替え可能）
 */
export function randomDropLevel(rng: () => number = Math.random): number {
  return Math.floor(rng() * (DROP_MAX_LEVEL + 1));
}
