import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AllLinks } from "./AllLinks";

// 내 링크 카테고리 칩 줄(CAT-01)과 서버 거르기(FEAT-008 AC-11)
function item(n: number, category: { id: string; name: string } | null) {
  return {
    id: `id-${n}`,
    url: `https://example.com/${n}`,
    normalizedUrl: `https://example.com/${n}`,
    createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    deletedAt: null,
    title: null,
    displayTitle: `레퍼런스 ${n}`,
    titleSource: "site",
    categoryId: category?.id ?? null,
    category,
    tags: [],
    thumbnail: { status: "failed", url: null, sourceUrl: null },
    faviconUrl: null,
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

const TRAVEL = { id: "c-travel", name: "여행" };
const DESIGN = { id: "c-design", name: "디자인" };
const LINKS = [item(3, TRAVEL), item(2, DESIGN), item(1, null)];

function setup({ failDelete = false } = {}) {
  const deleted: string[] = [];
  let categories = [
    { ...DESIGN, bookmarkCount: 1, pinned: false },
    { ...TRAVEL, bookmarkCount: 1, pinned: false },
  ];
  const listQueries: URLSearchParams[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = new URL(String(input), "http://x");
      const method = init.method ?? "GET";
      if (url.pathname === "/api/categories" && method === "POST") {
        const { name } = JSON.parse(String(init.body)) as { name: string };
        const made = { id: "c-new", name, bookmarkCount: 0, pinned: false };
        categories = [...categories, made];
        return json(201, made);
      }
      if (url.pathname.startsWith("/api/categories/") && method === "DELETE") {
        const id = url.pathname.split("/").at(-1);
        if (failDelete) {
          return json(500, {
            code: "INTERNAL",
            message: "잠시 후 다시 시도해 주세요.",
            requestId: "r",
          });
        }
        deleted.push(id!);
        categories = categories.filter((c) => c.id !== id);
        return new Response(null, { status: 204 });
      }
      if (url.pathname === "/api/categories") {
        return json(200, {
          items: categories,
          totalCount: 3,
          uncategorizedCount: 1,
        });
      }
      if (url.pathname === "/api/bookmarks" && method === "GET") {
        listQueries.push(url.searchParams);
        const categoryId = url.searchParams.get("categoryId");
        const loose = url.searchParams.get("uncategorized") === "true";
        const items = LINKS.filter((b) =>
          categoryId
            ? b.categoryId === categoryId
            : loose
              ? b.categoryId === null
              : true,
        );
        return json(200, { items, nextCursor: null });
      }
      return json(404, { code: "NOT_FOUND", message: "없음", requestId: "r" });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <AllLinks />
    </QueryClientProvider>,
  );
  return { listQueries, fetchMock, deleted };
}

function chips() {
  return within(screen.getByRole("group", { name: "카테고리" }));
}

function listHeading() {
  return screen.getByRole("heading", { level: 2, name: /.+/ });
}

describe("내 링크 카테고리 칩 줄 (CAT-01, FEAT-008 AC-11)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("전체 · 미분류가 맨 앞, 그다음 서버 순서의 카테고리. 칩마다 링크 수, 처음엔 전체가 골라져 있다", async () => {
    setup();
    await chips().findByRole("button", { name: /여행/ });
    expect(
      chips()
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["전체3", "미분류1", "디자인1", "여행1", "카테고리", "관리"]);
    expect(chips().getByRole("button", { name: /전체/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(listHeading()).toHaveTextContent("전체");
    expect(
      await screen.findByRole("link", { name: "레퍼런스 3" }),
    ).toBeInTheDocument();
  });

  it("카테고리 칩을 고르면 서버에 그 카테고리로 거르고, 목록 제목이 그 이름이 된다", async () => {
    const { listQueries } = setup();
    await userEvent.click(await chips().findByRole("button", { name: /여행/ }));

    expect(
      await screen.findByRole("link", { name: "레퍼런스 3" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "레퍼런스 2" }),
    ).not.toBeInTheDocument();
    expect(listHeading()).toHaveTextContent("여행");
    expect(chips().getByRole("button", { name: /여행/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(listQueries.at(-1)?.get("categoryId")).toBe("c-travel");
    expect(listQueries.at(-1)?.has("uncategorized")).toBe(false);
  });

  it("미분류 칩은 uncategorized=true로 거른다", async () => {
    const { listQueries } = setup();
    await userEvent.click(
      await chips().findByRole("button", { name: /미분류/ }),
    );
    expect(
      await screen.findByRole("link", { name: "레퍼런스 1" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "레퍼런스 3" }),
    ).not.toBeInTheDocument();
    expect(listHeading()).toHaveTextContent("미분류");
    expect(listQueries.at(-1)?.get("uncategorized")).toBe("true");
  });

  it("+ 카테고리로 만들면 그 칩이 골라지고 빈 목록 문구를 보여 준다", async () => {
    const { fetchMock } = setup();
    await userEvent.click(
      await chips().findByRole("button", { name: "카테고리" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "브랜딩{Enter}",
    );

    expect(
      await chips().findByRole("button", { name: /브랜딩/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(listHeading()).toHaveTextContent("브랜딩");
    expect(
      await screen.findByText("이 카테고리에 링크가 없어요."),
    ).toBeInTheDocument();
    const posts = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST",
    );
    expect(posts).toHaveLength(1);
  });

  it("+ 카테고리 이름이 20자를 넘으면 오류 문구와 함께 저장을 막는다", async () => {
    setup();
    await userEvent.click(
      await chips().findByRole("button", { name: "카테고리" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "가".repeat(21),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "카테고리 이름은 1~20자로 입력해 주세요.",
    );
    expect(chips().getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("칩을 바꾸면 골라 둔 링크 선택을 푼다", async () => {
    setup();
    const box = await screen.findByRole("checkbox", { name: /레퍼런스 3/ });
    await userEvent.click(box);
    expect(screen.getAllByText(/1개 선택/).length).toBeGreaterThan(0);

    await userEvent.click(chips().getByRole("button", { name: /여행/ }));
    expect(screen.queryAllByText(/1개 선택/)).toHaveLength(0);
  });

  it("[관리]: 링크가 있는 카테고리는 확인 뒤 지우고, 보던 칩이면 전체로 돌아간다", async () => {
    const { deleted } = setup();
    await userEvent.click(await chips().findByRole("button", { name: /여행/ }));
    expect(listHeading()).toHaveTextContent("여행");

    await userEvent.click(chips().getByRole("button", { name: "관리" }));
    const dialog = screen.getByRole("dialog", { name: "카테고리 관리" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "여행 삭제" }),
    );
    expect(dialog).toHaveTextContent(
      "'여행'을(를) 삭제할까요? 링크 1개는 지워지지 않고 미분류가 돼요.",
    );
    expect(deleted).toEqual([]);
    await userEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

    await vi.waitFor(() => expect(deleted).toEqual(["c-travel"]));
    expect(
      await within(dialog).findByRole("button", { name: "디자인 삭제" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "여행 삭제" }),
    ).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(listHeading()).toHaveTextContent("전체");
    expect(chips().getByRole("button", { name: "관리" })).toHaveFocus();
  });

  it("[관리]: 확인에서 취소하면 지우지 않는다. Esc는 확인을 닫고, 한 번 더 누르면 모달을 닫는다", async () => {
    const { deleted } = setup();
    await userEvent.click(await chips().findByRole("button", { name: "관리" }));
    const dialog = screen.getByRole("dialog", { name: "카테고리 관리" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "디자인 삭제" }),
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(
      within(dialog).getByRole("button", { name: "디자인 삭제" }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "디자인 삭제" }),
    );
    await userEvent.keyboard("{Escape}");
    expect(
      within(dialog).getByRole("button", { name: "디자인 삭제" }),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleted).toEqual([]);
  });

  it("[관리]: 링크가 0개인 카테고리는 확인 없이 바로 지운다", async () => {
    const { deleted } = setup();
    // 0개짜리를 하나 만든다
    await userEvent.click(
      await chips().findByRole("button", { name: "카테고리" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "빈 칸{Enter}",
    );
    await chips().findByRole("button", { name: /빈 칸/ });

    await userEvent.click(chips().getByRole("button", { name: "관리" }));
    const dialog = screen.getByRole("dialog", { name: "카테고리 관리" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "빈 칸 삭제" }),
    );
    await vi.waitFor(() => expect(deleted).toEqual(["c-new"]));
    expect(dialog).not.toHaveTextContent("삭제할까요?");
  });

  it("[관리]: 삭제에 실패하면 서버 문구를 보여 주고 카테고리는 그대로다", async () => {
    setup({ failDelete: true });
    await userEvent.click(await chips().findByRole("button", { name: "관리" }));
    const dialog = screen.getByRole("dialog", { name: "카테고리 관리" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "여행 삭제" }),
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "잠시 후 다시 시도해 주세요.",
    );
    expect(chips().getByRole("button", { name: /여행/ })).toBeInTheDocument();
  });
});
