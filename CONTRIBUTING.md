# 開発ガイド（TDD 運用契約）

このリポジトリは **テスト駆動開発（TDD）** を規律として運用します。
目的は「モダンな開発プロセスの練習」なので、あえて厳しめのゲートを敷いています。

## Red → Green → Refactor

1. **Red** — まず失敗するテストを書く。`test:` として単独コミットする。
2. **Green** — 最小の実装でテストを通す。`feat:` / `fix:` でコミット。
3. **Refactor** — 重複や命名を整える。テストは緑のまま。`refactor:` でコミット。

> コミット順で `test:` → `feat:` の並びを作ることで、「テストが先」を履歴に残します。
> レビューではこの順序を確認します。

## レイヤーとテスト戦略

| レイヤー     | 場所           | テスト手段                                                  |
| ------------ | -------------- | ----------------------------------------------------------- |
| 純粋ロジック | `src/core/`    | **Vitest 単体テスト**（厚く／パッチ100%／ミューテーション） |
| 物理アダプタ | `src/physics/` | E2E で担保                                                  |
| 描画         | `src/render/`  | E2E で担保                                                  |
| 配線         | `src/main.ts`  | E2E で担保                                                  |

`src/core/` は副作用ゼロ（Matter.js / DOM に触れない）に保ちます。ここがテストの主戦場です。

## 機械的に強制されるルール（CIで赤になる）

- **型チェック**: `npm run typecheck`
- **Lint / 整形**: `npm run lint` / `npm run format:check`（`it.only`・`.skip` は error）
- **単体テスト + 全体カバレッジ閾値**: `npm run coverage`（core 90%）
- **パッチカバレッジ 100%**: `npm run coverage:patch`（変更行に未被覆があれば失敗）
- **ミューテーションテスト**: `npm run mutation`（Stryker、スコア閾値 80 で break）
- **ビルド**: `npm run build`
- **E2E**: `npm run e2e`

`main` はブランチ保護され、上記CIが緑でなければ merge できません。

## ローカルの流れ

```bash
npm run test:watch     # TDD 中はこれを回しっぱなし
npm run check          # commit 前の一括チェック（typecheck+lint+format+test）
```

コミット時は Husky が変更分の lint/format を、push 時に typecheck とテストを自動実行します。

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従います（commitlint で強制）。

```
test: 合体スコアの失敗テストを追加
feat: フルーツ合体ロジックを実装
fix: スイカ同士の消滅を修正
refactor: scoring を core へ分離
```
