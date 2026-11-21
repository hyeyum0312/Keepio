import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AllLinks } from "./AllLinks";

function item(n: number) {
  return {
    id: `id-${n}`,
    url: `https://example.com/${n}`,
    normalizedUrl: `https://example.com/${n}`,
    createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    deletedAt: null,
    title: null,
    displayTitle: `레퍼런스 ${n}`,
    tags: [{ id: `t-${n}`, name: "모션" }],
    thumbnail: { status: "failed", url: null },
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function setup() {
  const bodies: unknown[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      if (method === "GET")
        return json(200, { items: [item(2), item(1)], nextCursor: null });
      bodies.push(JSON.parse(String(init.body)));
      return json(201, item(3));
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <AllLinks />
    </QueryClientProvider>,
  );
  return { bodies };
}

describe("전체 링크 화면 (LINK-01 시안, FEAT-009 후속)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("제목·태그는 접혀 있다가 펼치면 보이고, 다시 접어도 입력한 값은 함께 저장된다", async () => {
    const { bodies } = setup();
    const toggle = screen.getByRole("button", {
      name: "추가 정보 입력하기 (선택)",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("제목 (선택)")).not.toBeVisible();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.type(screen.getByLabelText("제목 (선택)"), "랜딩");
    await userEvent.click(toggle);

    await userEvent.type(
      screen.getByLabelText("링크 주소"),
      "https://example.com/3",
    );
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    await vi.waitFor(() =>
      expect(bodies[0]).toEqual({
        url: "https://example.com/3",
        title: "랜딩",
      }),
    );
  });

  it("목록형이 기본이고 카드형으로 바꿀 수 있다. 어느 쪽이든 제목·도메인·태그를 보여 준다", async () => {
    setup();
    await screen.findByRole("link", { name: "레퍼런스 2" });
    const group = screen.getByRole("group", { name: "보기 방식" });
    const list = within(group).getByRole("button", { name: "목록으로 보기" });
    const grid = within(group).getByRole("button", { name: "카드로 보기" });
    expect(list).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(grid);
    expect(grid).toHaveAttribute("aria-pressed", "true");
    expect(list).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("link", { name: "레퍼런스 2" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("example.com")).toHaveLength(2);
    expect(screen.getAllByText("#모션")).toHaveLength(2);
  });

  it("⋯ 메뉴는 Esc로 닫히고 버튼으로 포커스가 돌아온다", async () => {
    setup();
    const more = await screen.findByRole("button", {
      name: "더보기: 레퍼런스 2",
    });
    await userEvent.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "수정" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });
});
