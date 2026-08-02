/**
 * Matter.js を用いた物理シミュレーションの薄いラッパー。
 * 盤面の壁・床の生成、フルーツ剛体の追加、ステップ実行を提供する。
 * ゲームのルール（合体・スコア・ゲームオーバー）はここには持たない。
 */
import { Bodies, Body, Composite, Engine, World } from "matter-js";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../core/board";
import { getFruit } from "../core/fruits";

/** 壁の厚み (px)。内側の面が盤面の縁に一致するよう配置する。 */
const WALL_THICKNESS = 60;

/** フルーツ剛体に紐づく追加情報（Matter の plugin 経由で保持）。 */
export interface FruitPlugin {
  /** 進化段階 */
  level: number;
}

/** level 情報付きのフルーツ剛体。 */
export type FruitBody = Body & { plugin: FruitPlugin };

/** フルーツ剛体かどうかを判定する。 */
export function isFruitBody(body: Body): body is FruitBody {
  const plugin = body.plugin as Partial<FruitPlugin> | undefined;
  return typeof plugin?.level === "number";
}

/** 物理世界と、盤面に配置済みの壁・床をまとめて生成する。 */
export function createPhysics(
  width: number = BOARD_WIDTH,
  height: number = BOARD_HEIGHT,
): { engine: Engine; world: World } {
  const engine = Engine.create();
  engine.gravity.y = 1;

  const half = WALL_THICKNESS / 2;
  const wallOptions = { isStatic: true, restitution: 0.1, friction: 0.3 };

  const floor = Bodies.rectangle(
    width / 2,
    height + half,
    width + WALL_THICKNESS * 2,
    WALL_THICKNESS,
    wallOptions,
  );
  const leftWall = Bodies.rectangle(-half, height / 2, WALL_THICKNESS, height * 2, wallOptions);
  const rightWall = Bodies.rectangle(
    width + half,
    height / 2,
    WALL_THICKNESS,
    height * 2,
    wallOptions,
  );

  Composite.add(engine.world, [floor, leftWall, rightWall]);
  return { engine, world: engine.world };
}

/**
 * 指定段階のフルーツ剛体を生成して世界に追加する。
 * @returns 追加した剛体（level 情報付き）
 */
export function addFruit(world: World, level: number, x: number, y: number): FruitBody {
  const fruit = getFruit(level);
  const body = Bodies.circle(x, y, fruit.radius, {
    restitution: 0.15,
    friction: 0.4,
    frictionStatic: 0.6,
    density: 0.001,
    label: `fruit:${level}`,
  }) as FruitBody;
  body.plugin = { level };
  Composite.add(world, body);
  return body;
}

/** 世界に存在するフルーツ剛体の一覧を返す。 */
export function fruitBodies(world: World): FruitBody[] {
  return Composite.allBodies(world).filter(isFruitBody);
}

/** 世界からフルーツ剛体をすべて取り除く（壁・床は残す）。リスタート用。 */
export function clearFruits(world: World): void {
  for (const body of fruitBodies(world)) {
    Composite.remove(world, body);
  }
}

/** 物理を 1 ステップ進める。delta はミリ秒。 */
export function step(engine: Engine, deltaMs: number): void {
  Engine.update(engine, deltaMs);
}
