import { defineConfig } from "orval";

// 입력은 apps/api가 내보낸 openapi.json. 생성물은 커밋하고 손으로 고치지 않는다(npm run openapi:generate)
export default defineConfig({
  keepio: {
    input: { target: "./openapi.json" },
    output: {
      target: "./src/generated/endpoints.ts",
      schemas: "./src/generated/model",
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: { path: "./src/api-fetch.ts", name: "apiFetch" },
      },
    },
  },
});
