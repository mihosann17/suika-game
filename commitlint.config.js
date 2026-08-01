export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 日本語コミット＋固有名詞(ESLint/Stryker 等)の大文字始まりを許容するため無効化
    "subject-case": [0],
  },
};
