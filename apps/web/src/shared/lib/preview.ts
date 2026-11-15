// 디자인 미리보기 화면(/preview/*)은 개발 환경에서만 연다. 배포(production)에서는 404
export function isPreviewEnabled(
  env: string | undefined = process.env.NODE_ENV,
) {
  return env !== "production";
}
