import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";

// hex/rgb/hsl/oklch 리터럴, Tailwind 임의 색상(bg-[#fff]) 모두 포함
const COLOR_LITERAL = String.raw`/#[0-9a-fA-F]{3,8}\b|(rgba?|hsla?|oklch)\(/`;
const COLOR_MESSAGE =
  "색상 리터럴 금지. globals.css 토큰(예: text-foreground, bg-ai)을 사용한다. 새 토큰이 필요하면 DESIGN.md 절차를 따른다.";
const FEATURE_DEEP_IMPORT_MESSAGE =
  "다른 feature의 내부 폴더 import 금지. '@/features/<name>'(index.ts)로만 import한다.";

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
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message: FEATURE_DEEP_IMPORT_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message: FEATURE_DEEP_IMPORT_MESSAGE,
            },
            {
              group: ["../../*"],
              message:
                "feature 밖으로 나가는 상대 경로 금지. 다른 feature는 '@/features/<name>', 공용은 '@/shared/...'로 import.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/*/*"],
              message: "shared는 feature에 의존하지 않는다.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
