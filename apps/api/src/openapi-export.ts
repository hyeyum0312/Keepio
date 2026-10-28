import "reflect-metadata";
import { writeFile } from "node:fs/promises";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { createOpenApiDocument } from "./setup-app.js";

// preview 모드는 provider를 만들지 않으므로 DB 없이 문서만 뽑는다
async function exportOpenApi(outFile: string) {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  const document = createOpenApiDocument(app);
  await writeFile(outFile, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

const outFile = process.argv[2];
if (!outFile) {
  console.error("usage: node dist/openapi-export.js <out.json>");
  process.exit(1);
}
await exportOpenApi(outFile);
