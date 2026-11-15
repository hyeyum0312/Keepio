import { isPreviewEnabled } from "./preview";

describe("디자인 미리보기 공개 범위", () => {
  it("배포(production)에서는 열지 않는다", () => {
    expect(isPreviewEnabled("production")).toBe(false);
  });

  it("개발·테스트 환경에서는 연다", () => {
    expect(isPreviewEnabled("development")).toBe(true);
    expect(isPreviewEnabled("test")).toBe(true);
  });
});
