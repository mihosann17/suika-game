/**
 * キャンバスへの描画。物理状態（剛体の位置・角度）を読み取って描くだけで、
 * 状態を変更しない。
 */
import { DANGER_LINE_Y } from "../core/board";
import { getFruit } from "../core/fruits";
import type { FruitBody } from "./physics";

/** 1 つのフルーツを、円の下地＋絵文字で描く。 */
function drawFruit(
  ctx: CanvasRenderingContext2D,
  level: number,
  x: number,
  y: number,
  angle: number,
): void {
  const fruit = getFruit(level);
  const r = fruit.radius;

  ctx.save();
  ctx.translate(x, y);

  // 下地の円
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = fruit.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.stroke();

  // 絵文字（剛体の回転に追従）
  ctx.rotate(angle);
  ctx.font = `${Math.round(r * 1.4)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fruit.emoji, 0, r * 0.06);

  ctx.restore();
}

/** 危険ライン（点線）を描く。 */
function drawDangerLine(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(208, 68, 43, 0.4)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, DANGER_LINE_Y);
  ctx.lineTo(width, DANGER_LINE_Y);
  ctx.stroke();
  ctx.restore();
}

/** 落下位置のガイド（縦の点線）を描く。 */
function drawAimGuide(ctx: CanvasRenderingContext2D, x: number, height: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(107, 74, 43, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  ctx.restore();
}

/** 描画に必要な 1 フレーム分の状態。 */
export interface Scene {
  bodies: readonly FruitBody[];
  /** 落下待機中のフルーツ（段階と中心座標）。null なら非表示。 */
  pending: { level: number; x: number; y: number } | null;
  /** ガイド線を引く x。null なら非表示。 */
  aimX: number | null;
}

/** シーン全体を 1 フレーム描画する。 */
export function render(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  drawDangerLine(ctx, width);
  if (scene.aimX !== null) {
    drawAimGuide(ctx, scene.aimX, height);
  }
  for (const body of scene.bodies) {
    drawFruit(ctx, body.plugin.level, body.position.x, body.position.y, body.angle);
  }
  if (scene.pending) {
    drawFruit(ctx, scene.pending.level, scene.pending.x, scene.pending.y, 0);
  }
}
