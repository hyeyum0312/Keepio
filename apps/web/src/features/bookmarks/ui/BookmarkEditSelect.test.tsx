import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AllLinks } from "./AllLinks";
import { BookmarkList } from "./BookmarkList";

type Item = ReturnType<typeof item>;

function item(n: number, extra: Partial<Record<string, unknown>> = {}) {
  return {
    id: `id-${n}`,
    url: `https://example.com/${n}`,
    normalizedUrl: `https://example.com/${n}`,
    createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    deletedAt: null,
    title: `레퍼런스 ${n}`,
    displayTitle: `레퍼런스 ${n}`,
    titleSource: "user",
    categoryId: null,
    tags: [{ id: `t-${n}`, name: "모션" }],
    thumbnail: { status: "failed", url: null, sourceUrl: null },
    faviconUrl: null,
    ...extra,
  };
}

function json(status: number, body: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

// 서버 흉내: 목록은 items, PATCH·DELETE는 handler로
function setup(
  items: Item[],
  handler: (
    method: string,
    path: string,
    body: unknown,
  ) => Response | null = () => null,
  ui: React.ReactNode = <AllLinks />,
) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const path = new URL(String(input), "http://local").pathname;
      calls.push(`${method} ${path}`);
      const body =
        typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      const handled = handler(method, path, body);
      if (handled) return handled;
      return json(200, { items, nextCursor: null });
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { calls };
}

async function openEdit(name: string) {
  await userEvent.click(
    await screen.findByRole("button", { name: `더보기: ${name}` }),
  );
  await userEvent.click(screen.getByRole("menuitem", { name: "수정" }));
  return screen.getByRole("textbox", { name: "링크 제목" });
}

describe("FEAT-011 제목 수정", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("AC-01: ⋯ 메뉴 수정 → 줄 안 입력칸, Enter로 PATCH하고 목록을 다시 받는다. 끝나면 ⋯ 버튼으로 포커스", async () => {
    let sent: unknown;
    const { calls } = setup([item(1)], (method, _path, body) => {
      if (method !== "PATCH") return null;
      sent = body;
      return json(200, item(1, { title: "새 제목", displayTitle: "새 제목" }));
    });
    const input = await openEdit("레퍼런스 1");
    expect(input).toHaveValue("레퍼런스 1");
    expect(screen.queryByText("#모션")).not.toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "새 제목{Enter}");

    await waitFor(() => expect(calls).toContain("PATCH /api/bookmarks/id-1"));
    expect(sent).toEqual({ title: "새 제목" });
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "링크 제목" }),
      ).not.toBeInTheDocument(),
    );
    expect(calls.filter((c) => c === "GET /api/bookmarks").length).toBe(2);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "더보기: 레퍼런스 1" }),
      ).toHaveFocus(),
    );
  });

  it("AC-01·02: Esc·취소는 저장하지 않고, 비우고 저장하면 title: null", async () => {
    let sent: unknown;
    const { calls } = setup([item(1)], (method, _p, body) => {
      if (method !== "PATCH") return null;
      sent = body;
      return json(200, item(1));
    });
    await userEvent.keyboard("{Escape}");
    let input = await openEdit("레퍼런스 1");
    await userEvent.keyboard("{Escape}");
    expect(input).not.toBeInTheDocument();
    input = await openEdit("레퍼런스 1");
    await userEvent.click(
      within(input.closest("li")!).getByRole("button", { name: "취소" }),
    );
    expect(calls.some((c) => c.startsWith("PATCH"))).toBe(false);

    input = await openEdit("레퍼런스 1");
    await userEvent.clear(input);
    await userEvent.click(
      within(input.closest("li")!).getByRole("button", { name: "저장" }),
    );
    await waitFor(() => expect(sent).toEqual({ title: null }));
  });

  it("AC-03: 서버가 거부하면 입력칸 아래 문구와 오류 표시, 입력칸은 그대로", async () => {
    setup([item(1)], (method) =>
      method === "PATCH"
        ? json(400, {
            code: "VALIDATION_FAILED",
            message: "제목은 100자까지 입력할 수 있어요.",
            requestId: "r",
          })
        : null,
    );
    const input = await openEdit("레퍼런스 1");
    await userEvent.type(input, "x{Enter}");
    expect(
      await screen.findByText("제목은 100자까지 입력할 수 있어요."),
    ).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("AC-04: 사이트 이름으로 보이는 링크는 '제목 넣기', 누르면 빈 입력칸", async () => {
    setup([
      item(1, {
        title: null,
        displayTitle: "쿠팡 상품",
        titleSource: "site",
      }),
      item(2),
    ]);
    await userEvent.click(
      await screen.findByRole("button", { name: "제목 넣기: 쿠팡 상품" }),
    );
    expect(screen.getByRole("textbox", { name: "링크 제목" })).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "제목 넣기: 레퍼런스 2" }),
    ).not.toBeInTheDocument();
  });
});

describe("FEAT-011 여러 개 선택", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("AC-06: 링크가 0개면 모두 선택 체크박스와 모바일 선택 버튼을 그리지 않는다", async () => {
    setup([]);
    expect(
      await screen.findByText("저장한 링크가 없어요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "이 화면의 링크 모두 선택" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "선택" }),
    ).not.toBeInTheDocument();
  });

  it("AC-06·08: 썸네일 체크박스로 고르면 작업 막대가 나오고, 모두 선택은 중간 상태를 보여 준다. ✕로 푼다", async () => {
    setup([item(1), item(2), item(3)]);
    const first = await screen.findByRole("checkbox", {
      name: "선택: 레퍼런스 1",
    });
    expect(screen.queryAllByRole("toolbar")).toHaveLength(0);

    await userEvent.click(first);
    expect(first).toBeChecked();
    const bars = screen.getAllByRole("toolbar", { name: "선택한 링크 작업" });
    expect(within(bars[0]).getByText("1개 선택")).toBeInTheDocument();
    expect(
      within(bars[0]).getByRole("button", { name: /^버킷에 추가/ }),
    ).toHaveAttribute("aria-disabled", "true");
    const all = screen.getByRole("checkbox", {
      name: "이 화면의 링크 모두 선택",
    }) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);

    await userEvent.click(all);
    expect(
      screen.getByRole("checkbox", { name: "선택: 레퍼런스 3" }),
    ).toBeChecked();
    expect(all.indeterminate).toBe(false);

    await userEvent.click(
      within(bars[0]).getByRole("button", { name: "선택 해제" }),
    );
    expect(first).not.toBeChecked();
    expect(screen.queryAllByRole("toolbar")).toHaveLength(0);
  });

  it("AC-09: 고른 링크를 휴지통으로 옮기고, 실패한 것은 고른 채로 남긴다", async () => {
    const { calls } = setup([item(1), item(2), item(3)], (method, path) => {
      if (method !== "DELETE") return null;
      return path.endsWith("id-2")
        ? json(500, { code: "INTERNAL", message: "x", requestId: "r" })
        : json(204, undefined);
    });
    for (const n of [1, 2, 3]) {
      await userEvent.click(
        await screen.findByRole("checkbox", { name: `선택: 레퍼런스 ${n}` }),
      );
    }
    const [pcBar] = screen.getAllByRole("toolbar");
    await userEvent.click(within(pcBar).getByRole("button", { name: "삭제" }));

    expect(
      await screen.findByText(
        "2개를 휴지통으로 옮겼어요. 1개는 옮기지 못했어요. 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(calls.filter((c) => c.startsWith("DELETE")).sort()).toEqual([
      "DELETE /api/bookmarks/id-1",
      "DELETE /api/bookmarks/id-2",
      "DELETE /api/bookmarks/id-3",
    ]);
    expect(
      screen.getByRole("checkbox", { name: "선택: 레퍼런스 2" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "선택: 레퍼런스 1" }),
    ).not.toBeChecked();
  });

  it("AC-10: 보기를 바꿔도 고른 링크는 유지되고, Esc로 선택을 푼다", async () => {
    setup([item(1), item(2)]);
    await userEvent.click(
      await screen.findByRole("checkbox", { name: "선택: 레퍼런스 2" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "카드로 보기" }));
    expect(
      screen.getByRole("checkbox", { name: "선택: 레퍼런스 2" }),
    ).toBeChecked();
    await userEvent.keyboard("{Escape}");
    expect(
      screen.getByRole("checkbox", { name: "선택: 레퍼런스 2" }),
    ).not.toBeChecked();
  });

  it("AC-07: 모바일 '선택'을 누르면 선택 모드(N개 선택 · 완료), 완료로 나간다", async () => {
    setup([item(1)]);
    await userEvent.click(await screen.findByRole("button", { name: "선택" }));
    const heading = screen.getByRole("heading", { level: 2, name: /선택/ });
    expect(heading).toHaveTextContent("0개 선택");
    expect(screen.getAllByRole("toolbar")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "완료" }));
    expect(heading).not.toHaveTextContent("개 선택");
    expect(screen.queryAllByRole("toolbar")).toHaveLength(0);
  });

  it("AC-10: 휴지통에는 체크박스·수정·이미지 바꾸기가 없다", async () => {
    setup(
      [item(1, { deletedAt: "2026-11-21T00:00:00.000Z" })],
      () => null,
      <BookmarkList status="deleted" />,
    );
    await screen.findByRole("button", { name: "복구: 레퍼런스 1" });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /더보기/ }),
    ).not.toBeInTheDocument();
  });
});
