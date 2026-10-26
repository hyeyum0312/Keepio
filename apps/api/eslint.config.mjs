import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import checkFile from "eslint-plugin-check-file";

const eslintConfig = defineConfig([
  globalIgnores(["dist/**", "src/generated/**"]),
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
  // QUALITY.md 테스트 작성 규칙
  {
    files: ["src/**/*.test.ts"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/expect-expect": "error",
      "vitest/no-identical-title": "error",
    },
  },
  // AGENTS.md 파일·네이밍: Nest 관례(health.controller.ts)는 kebab + 중간 확장자
  {
    files: ["src/**/*.ts"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/*.ts": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/**/": "KEBAB_CASE" },
      ],
    },
  },
]);

export default eslintConfig;
