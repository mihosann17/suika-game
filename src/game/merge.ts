/**
 * フルーツ同士の衝突を検知して「合体」を実行する配線。
 * ルール（合体可否・スコア・次段）は core（GameState / fruits）に委譲し、
 * ここは Matter のイベントと剛体の増減だけを扱う。
 */
import { Composite, Engine, Events, World } from "matter-js";
import { canMerge } from "../core/fruits";
import type { GameState } from "../core/gameState";
import { addFruit, isFruitBody } from "./physics";

/** 合体発生時に呼ばれるフック。 */
export interface MergeHooks {
  /**
   * @param mergedLevel 合体した2つの段階
   * @param producedLevel 生まれた段階（最大段階同士の消滅なら null）
   * @param x 合体地点の中心 x
   * @param y 合体地点の中心 y
   * @param gainedScore この合体で得たスコア
   */
  onMerge?(
    mergedLevel: number,
    producedLevel: number | null,
    x: number,
    y: number,
    gainedScore: number,
  ): void;
}

/**
 * 衝突→合体の監視を engine に登録する。
 * 同じ段階のフルーツが接触したら両者を消し、1段上のフルーツを中間点に生成する。
 * 1回の物理ステップ内で同じ剛体が二重に合体しないよう消費済みを追跡する。
 */
export function setupMerge(
  engine: Engine,
  world: World,
  state: GameState,
  hooks: MergeHooks = {},
): void {
  // このステップで既に合体に使われた剛体 id。afterUpdate で毎回クリアする。
  const consumed = new Set<number>();

  Events.on(engine, "collisionStart", (event) => {
    if (state.isOver) {
      return;
    }
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (!isFruitBody(a) || !isFruitBody(b)) {
        continue;
      }
      if (consumed.has(a.id) || consumed.has(b.id)) {
        continue;
      }
      if (!canMerge(a.plugin.level, b.plugin.level)) {
        continue;
      }

      const level = a.plugin.level;
      const x = (a.position.x + b.position.x) / 2;
      const y = (a.position.y + b.position.y) / 2;

      const outcome = state.resolveMerge(level, level);
      consumed.add(a.id);
      consumed.add(b.id);
      Composite.remove(world, a);
      Composite.remove(world, b);

      if (outcome.producedLevel !== null) {
        addFruit(world, outcome.producedLevel, x, y);
      }
      hooks.onMerge?.(level, outcome.producedLevel, x, y, outcome.gainedScore);
    }
  });

  Events.on(engine, "afterUpdate", () => {
    consumed.clear();
  });
}
