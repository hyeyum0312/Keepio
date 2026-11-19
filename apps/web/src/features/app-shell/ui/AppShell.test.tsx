import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("앱 틀 (FEAT-009)", () => {
  afterEach(() => window.localStorage.clear());

  it("현재 화면 메뉴를 표시하고, 기능이 없는 메뉴는 시안처럼 보이되 누를 수 없고 '준비 중'으로 읽힌다", () => {
    render(<AppShell>본문</AppShell>);
    const nav = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent("홈");
    for (const name of ["카테고리", "버킷", "공유한 페이지"]) {
      const item = within(nav).getByRole("link", {
        name: new RegExp(`^${name}\\s*\\(준비 중\\)$`),
      });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).not.toHaveAttribute("href");
    }
    expect(
      screen.getByRole("button", { name: "알림 (준비 중)" }),
    ).toHaveAttribute("aria-disabled", "true");
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

  it("계정 버튼은 위쪽 막대에 둔다", () => {
    render(
      <AppShell account={<button type="button">계정 메뉴</button>}>
        본문
      </AppShell>,
    );
    expect(
      screen.getByRole("button", { name: "계정 메뉴" }),
    ).toBeInTheDocument();
  });
});
