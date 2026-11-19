import { readFile } from "node:fs/promises";
import path from "node:path";
import { isPreviewEnabled } from "@/shared/lib/preview";

// 기획 와이어플로우(docs/design/wireflow.html, claude.ai 아티팩트 사본)를 그대로 보여준다.
// 개발 환경에서만 열리고 배포에서는 404. 파일은 public/에 두지 않아 배포 산출물에 섞이지 않는다
const WIREFLOW = path.join(
  process.cwd(),
  "..",
  "..",
  "docs",
  "design",
  "wireflow.html",
);

// 빌드할 때 HTML을 읽어 정적 파일로 만든다. 배포 서버에는 docs/ 폴더가 없어 실행 중에는 읽을 수 없다
export const dynamic = "force-static";

export async function GET() {
  if (!isPreviewEnabled()) return new Response("Not Found", { status: 404 });
  const html = await readFile(WIREFLOW, "utf8");
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
