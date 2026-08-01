import "./style.css";
import { FRUITS, randomDropLevel } from "./core/fruits";

/**
 * 土台段階の最小アプリ shell。
 * 盤面（枠・危険ライン）と NEXT フルーツを描画するだけ。
 * 物理・落下・合体などのゲームプレイは以降の PR で TDD 開発する。
 */
const WIDTH = 360;
const HEIGHT = 480;
const DANGER_LINE_Y = 84;

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

function drawShell(context: CanvasRenderingContext2D): void {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  // 危険ライン（点線）
  context.strokeStyle = "rgba(208, 68, 43, 0.4)";
  context.lineWidth = 2;
  context.setLineDash([6, 6]);
  context.beginPath();
  context.moveTo(0, DANGER_LINE_Y);
  context.lineTo(WIDTH, DANGER_LINE_Y);
  context.stroke();
  context.setLineDash([]);
}

drawShell(ctx);

// NEXT プレビューに次のフルーツを表示
const nextLevel = randomDropLevel();
const nextEl = document.querySelector("#next-fruit");
if (nextEl) {
  nextEl.textContent = FRUITS[nextLevel].emoji;
}
