// 개발 확인용 화면(/preview/*, 기획·디자인 링크)을 열지 정한다.
// 로컬 개발·테스트는 늘 열고, 배포 빌드는 NEXT_PUBLIC_SHOW_DEV_TOOLS=true인 환경(dev 테스트 배포)에서만 연다.
// 운영 배포에는 이 값을 넣지 않는다
export function isPreviewEnabled(
  env: string | undefined = process.env.NODE_ENV,
  flag: string | undefined = process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS,
) {
  return env !== "production" || flag === "true";
}
