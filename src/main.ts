import "./style.css";
import { BOARD_HEIGHT, BOARD_WIDTH, DANGER_LINE_Y, DROP_Y, clampDropX } from "./core/board";
import { getFruit, parseDropSequence, randomDropLevel } from "./core/fruits";
import { GameState, isOverflowing } from "./core/gameState";
import { addFruit, clearFruits, createPhysics, fruitBodies, step } from "./game/physics";
import { setupMerge } from "./game/merge";
import { loadBest, saveBest } from "./game/bestStore";
import { render } from "./game/render";

const WIDTH = BOARD_WIDTH;
const HEIGHT = BOARD_HEIGHT;
/** 連続投下を防ぐクールダウン (ms)。 */
const DROP_COOLDOWN_MS = 500;
/** 物理ステップの最大 delta (ms)。タブ復帰時などの飛びを抑える。 */
const MAX_STEP_MS = 1000 / 30;
/** 「静止」とみなす速度の閾値（これ以下ならゲームオーバー判定の対象）。 */
const SETTLE_SPEED = 0.8;
/** 危険ライン越えが継続してからゲームオーバーになるまでの猶予 (ms)。 */
const GAMEOVER_GRACE_MS = 1200;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
if (!canvas) {
  throw new Error("#game-canvas が見つかりません");
}
canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D コンテキストを取得できません");
}

const nextFruitEl = document.querySelector<HTMLElement>("#next-fruit");
const scoreEl = document.querySelector<HTMLElement>("#score");
const bestEl = document.querySelector<HTMLElement>("#best");
const gameoverEl = document.querySelector<HTMLElement>("#gameover");
const finalScoreEl = document.querySelector<HTMLElement>("#final-score");
const restartEl = document.querySelector<HTMLButtonElement>("#restart");

const { engine, world } = createPhysics(WIDTH, HEIGHT);
// 前回までのベストスコアを復元して開始する（リロードしても引き継ぐ）。
const state = new GameState(loadBest());

// 決定的な投下順（デバッグ/E2E 用）。?seq=0,0 のように指定すると循環して使う。
const forcedSequence = parseDropSequence(new URLSearchParams(window.location.search).get("seq"));
let forcedCursor = 0;
function nextDropLevel(): number {
  if (forcedSequence.length > 0) {
    return forcedSequence[forcedCursor++ % forcedSequence.length];
  }
  return randomDropLevel();
}

// 投下待ちフルーツと次のフルーツ。
let currentLevel = nextDropLevel();
let nextLevel = nextDropLevel();
// ポインタの盤面内 x（初期は中央）。
let pointerX = WIDTH / 2;
// クールダウン解除時刻（performance.now 基準）。0 なら投下可。
let readyAt = 0;
// 危険ライン越えを最初に検知した時刻。越えていなければ null。
let overflowSince: number | null = null;

function updateNextPreview(): void {
  if (nextFruitEl) {
    nextFruitEl.textContent = getFruit(nextLevel).emoji;
  }
}

function updateScore(): void {
  if (scoreEl) {
    scoreEl.textContent = String(state.score);
  }
  if (bestEl) {
    // ベストは end()/reset() で確定するため、プレイ中も現在スコアを候補に含めて即時表示する。
    bestEl.textContent = String(Math.max(state.best, state.score));
  }
}

setupMerge(engine, world, state, { onMerge: updateScore });

/** クライアント座標を盤面内の x へ変換する。 */
function toBoardX(clientX: number): number {
  const rect = canvas!.getBoundingClientRect();
  const scale = WIDTH / rect.width;
  return (clientX - rect.left) * scale;
}

function pendingRadius(): number {
  return getFruit(currentLevel).radius;
}

function canDrop(now: number): boolean {
  return now >= readyAt;
}

function drop(now: number): void {
  if (state.isOver || !canDrop(now)) {
    return;
  }
  const x = clampDropX(pointerX, pendingRadius());
  addFruit(world, currentLevel, x, DROP_Y);
  currentLevel = nextLevel;
  nextLevel = nextDropLevel();
  updateNextPreview();
  readyAt = now + DROP_COOLDOWN_MS;
}

/** ゲームオーバーにして結果オーバーレイを表示する。 */
function triggerGameOver(): void {
  state.end();
  saveBest(state.best);
  overflowSince = null;
  updateScore();
  if (finalScoreEl) {
    finalScoreEl.textContent = String(state.score);
  }
  gameoverEl?.classList.remove("hidden");
}

/** 静止フルーツの危険ライン越えが猶予時間を超えたらゲームオーバーにする。 */
function checkGameOver(now: number): void {
  const fruits = fruitBodies(world).map((b) => ({
    centerY: b.position.y,
    radius: getFruit(b.plugin.level).radius,
    speed: b.speed,
  }));
  if (isOverflowing(fruits, DANGER_LINE_Y, SETTLE_SPEED)) {
    if (overflowSince === null) {
      overflowSince = now;
    } else if (now - overflowSince >= GAMEOVER_GRACE_MS) {
      triggerGameOver();
    }
  } else {
    overflowSince = null;
  }
}

/** 盤面を初期化して再開する。ベストスコアは保持される。 */
function restart(): void {
  clearFruits(world);
  state.reset();
  saveBest(state.best);
  overflowSince = null;
  readyAt = 0;
  forcedCursor = 0;
  currentLevel = nextDropLevel();
  nextLevel = nextDropLevel();
  pointerX = WIDTH / 2;
  updateNextPreview();
  updateScore();
  gameoverEl?.classList.add("hidden");
  lastTime = performance.now();
}

canvas.addEventListener("pointermove", (e) => {
  pointerX = toBoardX(e.clientX);
});

canvas.addEventListener("pointerdown", (e) => {
  pointerX = toBoardX(e.clientX);
  drop(performance.now());
});

restartEl?.addEventListener("click", restart);

updateNextPreview();
updateScore();

let lastTime = performance.now();
function frame(now: number): void {
  if (!state.isOver) {
    const delta = Math.min(now - lastTime, MAX_STEP_MS);
    step(engine, delta);
    checkGameOver(now);
  }
  lastTime = now;

  // ゲームオーバー中は積まれたフルーツを凍結表示し、投下ガイドは隠す。
  const ready = !state.isOver && canDrop(now);
  const clampedX = clampDropX(pointerX, pendingRadius());
  render(
    ctx!,
    {
      bodies: fruitBodies(world),
      pending: ready ? { level: currentLevel, x: clampedX, y: DROP_Y } : null,
      aimX: ready ? clampedX : null,
    },
    WIDTH,
    HEIGHT,
  );

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
