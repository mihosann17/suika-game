# 🍉 スイカゲーム

同じフルーツをぶつけて合体させ、より大きなフルーツを目指す落ち物パズル。
**モダンな開発プロセス（静的解析・TDD・CI/CD）の練習**を目的とした個人プロジェクトです。

[![CI](https://github.com/mihosann17/suika-game/actions/workflows/ci.yml/badge.svg)](https://github.com/mihosann17/suika-game/actions/workflows/ci.yml)
[![Deploy](https://github.com/mihosann17/suika-game/actions/workflows/deploy.yml/badge.svg)](https://github.com/mihosann17/suika-game/actions/workflows/deploy.yml)

🎮 **プレイ**: https://mihosann17.github.io/suika-game/ （デプロイ後に有効）

## 技術スタック

- **Vite** + **TypeScript**
- **Matter.js**（物理エンジン）
- **Vitest**（単体テスト・カバレッジ）/ **Stryker**（ミューテーション）/ **Playwright**（E2E）
- **ESLint** + **Prettier** / **Husky** + **lint-staged** + **commitlint**
- **GitHub Actions**（CI/CD）/ **GitHub Pages**（配信）

## 設計方針: ロジックと物理の分離

```
src/
  core/       純粋ロジック（Matter.js/DOM非依存）★単体テストの主戦場
  physics/    Matter.js アダプタ
  render/     canvas 描画
  main.ts     配線
```

## 開発

```bash
npm install
npm run dev          # 開発サーバ (localhost:5173)
npm run test:watch   # TDD 中は回しっぱなし
npm run check        # typecheck + lint + format + test を一括
npm run coverage     # カバレッジ（HTML: coverage/index.html）
npm run mutation     # ミューテーションテスト
npm run e2e          # E2E（Playwright）
```

## 開発ルール

本リポジトリは **TDD** と **PRベースのフロー** を徹底しています。
詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

- `main` への直接 push は禁止。必ず PR → CI緑 → merge。
- 変更行はパッチカバレッジ100%必須。
- コミットは Conventional Commits。

## ライセンス

MIT
