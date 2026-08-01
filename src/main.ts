import "./style.css";

/**
 * 最小アプリ shell。盤面（枠・危険ライン）を描画するだけ。
 * フルーツ・物理・合体などのゲームプレイは以降の PR で段階的に追加する。
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

ctx.clearRect(0, 0, WIDTH, HEIGHT);
ctx.strokeStyle = "rgba(208, 68, 43, 0.4)";
ctx.lineWidth = 2;
ctx.setLineDash([6, 6]);
ctx.beginPath();
ctx.moveTo(0, DANGER_LINE_Y);
ctx.lineTo(WIDTH, DANGER_LINE_Y);
ctx.stroke();
