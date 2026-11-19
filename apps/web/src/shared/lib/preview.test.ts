import { isPreviewEnabled } from "./preview";

describe("디자인 미리보기 공개 범위", () => {
  it("배포(production)에서는 기본으로 열지 않는다", () => {
    expect(isPreviewEnabled("production", undefined)).toBe(false);
    expect(isPreviewEnabled("production", "false")).toBe(false);
  });

  it("배포라도 NEXT_PUBLIC_SHOW_DEV_TOOLS=true면 연다(dev 테스트 배포)", () => {
    expect(isPreviewEnabled("production", "true")).toBe(true);
  });

  it("개발·테스트 환경에서는 연다", () => {
    expect(isPreviewEnabled("development", undefined)).toBe(true);
    expect(isPreviewEnabled("test", undefined)).toBe(true);
  });
});
