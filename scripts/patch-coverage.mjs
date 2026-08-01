#!/usr/bin/env node
/**
 * パッチ（差分）カバレッジ検査。
 *
 * git の差分で「追加/変更された src/core の実行行」を取り出し、
 * lcov のヒット数と照合して、未被覆行が1つでもあれば失敗する。
 * TDD の「変更したコードには必ずテストがある」を機械的に強制するための自作ゲート。
 *
 * 使い方:
 *   node scripts/patch-coverage.mjs [--base <ref>] [--threshold <0-100>]
 * 既定:
 *   base      = 環境変数 PATCH_COVERAGE_BASE ?? "origin/main"
 *   threshold = 100  （変更行は100%被覆を要求）
 *
 * 事前に `npm run coverage` で coverage/lcov.info を生成しておくこと。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const ROOT = process.cwd();
const LCOV_PATH = resolve(ROOT, "coverage/lcov.info");
// 検査対象は単体テストの被覆スコープ（core）に限定する。
// physics/render は E2E で担保するため、パッチ被覆の対象外。
const SCOPE = "src/core";

function parseArgs(argv) {
  const args = { base: process.env.PATCH_COVERAGE_BASE ?? "origin/main", threshold: 100 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") args.base = argv[++i];
    else if (argv[i] === "--threshold") args.threshold = Number(argv[++i]);
  }
  return args;
}

/** base...HEAD の差分から、SCOPE 配下ファイルの「追加された新行番号」を集める。 */
function changedLines(base) {
  let diff;
  try {
    diff = execFileSync(
      "git",
      ["diff", "--unified=0", "--diff-filter=AM", `${base}...HEAD`, "--", SCOPE],
      { encoding: "utf8" },
    );
  } catch {
    // base が解決できない（初回・ローカル等）場合は直前コミットと比較
    diff = execFileSync(
      "git",
      ["diff", "--unified=0", "--diff-filter=AM", "HEAD~1...HEAD", "--", SCOPE],
      {
        encoding: "utf8",
      },
    );
  }

  const byFile = new Map();
  let current = null;
  let newLine = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).replace(/^b\//, "").trim();
      current = path === "/dev/null" ? null : path;
      if (current && !byFile.has(current)) byFile.set(current, new Set());
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      newLine = Number(hunk[1]);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      byFile.get(current).add(newLine);
      newLine++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      // 削除行は新ファイルの行を進めない
    }
  }
  // テストファイル自身は対象外
  for (const path of [...byFile.keys()]) {
    if (path.endsWith(".test.ts")) byFile.delete(path);
  }
  return byFile;
}

/** lcov.info を { 正規化パス -> Map(行 -> ヒット数) } に解析する。 */
function parseLcov() {
  if (!existsSync(LCOV_PATH)) {
    console.error(
      `✗ ${relative(ROOT, LCOV_PATH)} が見つかりません。先に \`npm run coverage\` を実行してください。`,
    );
    process.exit(2);
  }
  const text = readFileSync(LCOV_PATH, "utf8");
  const map = new Map();
  let file = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("SF:")) {
      const p = line.slice(3).replace(/\\/g, "/");
      file = p.startsWith("/") || /^[A-Za-z]:/.test(p) ? relative(ROOT, p).replace(/\\/g, "/") : p;
      if (!map.has(file)) map.set(file, new Map());
    } else if (line.startsWith("DA:") && file) {
      const [ln, hits] = line.slice(3).split(",").map(Number);
      map.get(file).set(ln, hits);
    } else if (line === "end_of_record") {
      file = null;
    }
  }
  return map;
}

function main() {
  const { base, threshold } = parseArgs(process.argv.slice(2));
  const changed = changedLines(base);
  const lcov = parseLcov();

  if (changed.size === 0) {
    console.log(`✓ パッチカバレッジ: ${SCOPE} に変更なし。スキップ。`);
    return;
  }

  let coverable = 0;
  let covered = 0;
  const misses = [];

  for (const [path, lines] of changed) {
    const fileCov = lcov.get(path);
    if (!fileCov) {
      // 変更されたのにカバレッジデータが無い＝未テストの可能性大
      misses.push(`${path}: カバレッジデータなし（テスト未実行の可能性）`);
      coverable += lines.size;
      continue;
    }
    for (const ln of lines) {
      const hits = fileCov.get(ln);
      if (hits === undefined) continue; // 非実行行（コメント/型など）
      coverable++;
      if (hits > 0) covered++;
      else misses.push(`${path}:${ln}`);
    }
  }

  if (coverable === 0) {
    console.log(`✓ パッチカバレッジ: 変更に実行行なし。スキップ。`);
    return;
  }

  const pct = (covered / coverable) * 100;
  console.log(
    `パッチカバレッジ: ${covered}/${coverable} 行 = ${pct.toFixed(1)}% (閾値 ${threshold}%)`,
  );

  if (pct + 1e-9 < threshold) {
    console.error(`✗ 未被覆の変更行:`);
    for (const m of misses) console.error(`   - ${m}`);
    console.error(`\nTDD ルール: 変更した行はテストで覆ってください（Red → Green）。`);
    process.exit(1);
  }
  console.log("✓ パッチカバレッジ合格");
}

main();
