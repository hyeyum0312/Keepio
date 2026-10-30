import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import vitest from "@vitest/eslint-plugin";
import checkFile from "eslint-plugin-check-file";

// hex/rgb/hsl/oklch 리터럴, Tailwind 임의 색상(bg-[#fff]) 모두 포함
const COLOR_LITERAL = String.raw`/#[0-9a-fA-F]{3,8}\b|(rgba?|hsla?|oklch)\(/`;
const COLOR_MESSAGE =
  "색상 리터럴 금지. globals.css 토큰(예: text-foreground, bg-ai)을 사용한다. 새 토큰이 필요하면 DESIGN.md 절차를 따른다.";
const FEATURE_DEEP_IMPORT_MESSAGE =
  "다른 feature의 내부 폴더 import 금지. '@/features/<name>'(index.ts)로만 import한다.";
// 경로 문자열이 아니라 실제로 가리키는 파일로 경계를 판단한다(상대 경로·별칭 모두).
// 설정을 읽을 때 목록을 만들므로, 에디터 ESLint는 새 feature 폴더를 만든 뒤 재시작해야 반영된다.
const FEATURE_NAMES = readdirSync(new URL("./src/features/", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react/display-name": "off",
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
    files: ["src/**/*.test.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/expect-expect": "error",
      "vitest/no-identical-title": "error",
    },
  },
  // AGENTS.md 파일·네이밍
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "src/{features,shared}/**/*.tsx": "PASCAL_CASE",
          "src/**/use[A-Z]*.ts": "CAMEL_CASE",
          "src/**/!(use[A-Z]*).ts": "KEBAB_CASE",
        },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/{features,shared}/**/": "KEBAB_CASE" },
      ],
    },
  },
  // DESIGN.md: 색상은 globals.css 토큰으로만
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${COLOR_LITERAL}]`,
          message: COLOR_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=${COLOR_LITERAL}]`,
          message: COLOR_MESSAGE,
        },
      ],
    },
  },
  // FRONTEND.md Structure (ADR-002): feature는 index.ts로만 import
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          // 에디터처럼 저장소 루트에서 실행해도 같은 기준으로 판단한다
          basePath: fileURLToPath(new URL(".", import.meta.url)),
          zones: [
            ...FEATURE_NAMES.map((name) => ({
              target: [
                "./src/!(features)/**/*",
                "./src/*",
                `./src/features/!(${name})/**/*`,
              ],
              from: `./src/features/${name}`,
              except: ["./index.ts"],
              message: FEATURE_DEEP_IMPORT_MESSAGE,
            })),
            {
              target: "./src/shared",
              from: "./src/features",
              message: "shared는 feature에 의존하지 않는다.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
