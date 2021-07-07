module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended"
  ],
  plugins: [
    "prettier"
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  rules: {
    "prettier/prettier": ["warn", {
      quotes: ["warn", "single"],
      "space-before-blocks": ["warn", { "functions": "always" }],
      "no-console": "off",
      "no-unused-var": "off"
    }, { usePrettierrc: true}]
  }
}