import { render, screen } from "@testing-library/react";
import { DesignViewer } from "./DesignViewer";

let view: string | null = null;
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(view ? { view } : {}),
}));

describe("개발용 기획·디자인 보기", () => {
  it("기본은 워크플로우를 화면 안에 띄운다", () => {
    view = null;
    render(<DesignViewer />);
    expect(screen.getByTitle("워크플로우")).toHaveAttribute(
      "src",
      "/preview/wireflow",
    );
  });

  it("claude.ai 시안은 새 탭 링크로 연다", () => {
    view = "auth-01";
    render(<DesignViewer />);
    expect(
      screen.getByRole("link", { name: /새 탭에서 열기/ }),
    ).toHaveAttribute("target", "_blank");
  });
});
