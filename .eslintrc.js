module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    // Complexidade ciclomática
    "complexity": ["warn", { "max": 5 }],
    // Tamanho de funções
    "max-lines-per-function": ["warn", { "max": 30 }],
    // Duplicação e code smells
    "no-duplicate-imports": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    // Boas práticas
    "eqeqeq": "error",
    "no-console": "warn",
    "no-var": "error",
    "prefer-const": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    // Manutenibilidade
    "max-depth": ["warn", { "max": 3 }],
    "max-params": ["warn", { "max": 4 }],
  },
  env: {
    node: true,
    es2020: true,
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js"],
};
