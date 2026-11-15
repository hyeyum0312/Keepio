import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("앱 틀 (FEAT-009)", () => {
  afterEach(() => window.localStorage.clear());

  it("현재 화면 메뉴를 표시하고, 기능이 없는 메뉴는 누를 수 없게 '준비 중'으로 둔다", () => {
    render(<AppShell>본문</AppShell>);
    const nav = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent("홈");
    const soon = screen.getAllByText(/준비 중/);
    expect(soon.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: /버킷/ }),
    ).not.toBeInTheDocument();
  });

  it("사이드바를 접으면 상태가 남고 펼치기 버튼으로 바뀐다", async () => {
    render(<AppShell>본문</AppShell>);
    await userEvent.click(
      screen.getByRole("button", { name: "사이드바 접기" }),
    );
    expect(window.localStorage.getItem("keepio.sidebarCollapsed")).toBe("1");
    expect(
      screen.getByRole("button", { name: "사이드바 펼치기" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("서버가 준 카테고리가 없으면 카테고리 영역을 그리지 않는다", () => {
    render(<AppShell>본문</AppShell>);
    expect(
      screen.queryByRole("navigation", { name: "카테고리" }),
    ).not.toBeInTheDocument();
  });
});
