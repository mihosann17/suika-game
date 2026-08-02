import "./style.css";
import { BOARD_HEIGHT, BOARD_WIDTH, DROP_Y, clampDropX } from "./core/board";
import { getFruit, parseDropSequence, randomDropLevel } from "./core/fruits";
import { GameState } from "./core/gameState";
import { addFruit, createPhysics, fruitBodies, step } from "./game/physics";
import { setupMerge } from "./game/merge";
import { render } from "./game/render";

const WIDTH = BOARD_WIDTH;
const HEIGHT = BOARD_HEIGHT;
/** 連続投下を防ぐクールダウン (ms)。 */
const DROP_COOLDOWN_MS = 500;
/** 物理ステップの最大 delta (ms)。タブ復帰時などの飛びを抑える。 */
const MAX_STEP_MS = 1000 / 30;

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

const { engine, world } = createPhysics(WIDTH, HEIGHT);
const state = new GameState();

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
    // ゲームオーバー未実装のため、表示上は現在スコアもベスト候補に含める。
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
  if (!canDrop(now)) {
    return;
  }
  const x = clampDropX(pointerX, pendingRadius());
  addFruit(world, currentLevel, x, DROP_Y);
  currentLevel = nextLevel;
  nextLevel = nextDropLevel();
  updateNextPreview();
  readyAt = now + DROP_COOLDOWN_MS;
}

canvas.addEventListener("pointermove", (e) => {
  pointerX = toBoardX(e.clientX);
});

canvas.addEventListener("pointerdown", (e) => {
  pointerX = toBoardX(e.clientX);
  drop(performance.now());
});

updateNextPreview();
updateScore();

let lastTime = performance.now();
function frame(now: number): void {
  const delta = Math.min(now - lastTime, MAX_STEP_MS);
  lastTime = now;
  step(engine, delta);

  const ready = canDrop(now);
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
