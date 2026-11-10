import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkPanel } from "./BookmarkPanel";

type Bookmark = {
  id: string;
  url: string;
  normalizedUrl: string;
  createdAt: string;
  deletedAt: string | null;
};

function bookmark(n: number, deleted = false): Bookmark {
  return {
    id: `id-${n}`,
    url: `https://example.com/${n}`,
    normalizedUrl: `https://example.com/${n}`,
    createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    deletedAt: deleted ? new Date().toISOString() : null,
  };
}

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

// 메모리 서버: 활성·휴지통 목록과 요청 기록. 응답 규칙은 테스트마다 덮어쓴다
function fakeServer(initial: Bookmark[]) {
  let rows = [...initial];
  const calls: { method: string; path: string; query: string }[] = [];
  const overrides: Record<string, () => Response> = {};
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = new URL(String(input), "http://local");
      const method = init.method ?? "GET";
      calls.push({ method, path: url.pathname, query: url.search });
      const override = overrides[`${method} ${url.pathname}`];
      if (override) return override();
      if (method === "GET" && url.pathname === "/api/bookmarks") {
        const status = url.searchParams.get("status") ?? "active";
        const list = rows.filter((r) =>
          status === "active" ? !r.deletedAt : !!r.deletedAt,
        );
        const cursor = url.searchParams.get("cursor");
        const start = cursor ? Number(cursor) : 0;
        const page = list.slice(start, start + 2);
        const next = start + 2 < list.length ? String(start + 2) : null;
        return json(200, { items: page, nextCursor: next });
      }
      const id = url.pathname.split("/")[3];
      if (method === "DELETE") {
        rows = rows.map((r) =>
          r.id === id ? { ...r, deletedAt: new Date().toISOString() } : r,
        );
        return json(204);
      }
      if (method === "POST" && url.pathname.endsWith("/restore")) {
        rows = rows.map((r) => (r.id === id ? { ...r, deletedAt: null } : r));
        return json(
          200,
          rows.find((r) => r.id === id),
        );
      }
      if (method === "POST" && url.pathname === "/api/bookmarks") {
        const body = JSON.parse(String(init.body)) as { url: string };
        const created = { ...bookmark(99), url: body.url };
        rows = [created, ...rows];
        return json(201, created);
      }
      throw new Error(`unexpected ${method} ${url.pathname}`);
    }),
  );
  return {
    calls,
    overrides,
    listCalls: (status: string) =>
      calls.filter(
        (c) =>
          c.method === "GET" &&
          c.path === "/api/bookmarks" &&
          c.query.includes(`status=${status}`),
      ).length,
  };
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BookmarkPanel />
    </QueryClientProvider>,
  );
}

const links = () =>
  screen.queryAllByRole("link").map((a) => a.getAttribute("href"));

describe("북마크 화면 (FEAT-002)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("AC-10: 서버 순서대로 보여 주고 [더 보기]는 받은 nextCursor를 그대로 넘긴다", async () => {
    const server = fakeServer([bookmark(3), bookmark(2), bookmark(1)]);
    renderPanel();

    expect(
      await screen.findByText("https://example.com/3"),
    ).toBeInTheDocument();
    expect(links()).toEqual(["https://example.com/3", "https://example.com/2"]);

    await userEvent.click(screen.getByRole("button", { name: "더 보기" }));

    await vi.waitFor(() =>
      expect(links()).toEqual([
        "https://example.com/3",
        "https://example.com/2",
        "https://example.com/1",
      ]),
    );
    expect(server.calls.at(-1)?.query).toContain("cursor=2");
    expect(
      screen.queryByRole("button", { name: "더 보기" }),
    ).not.toBeInTheDocument();
  });

  it("AC-10: 링크는 새 탭으로 열고 opener를 넘기지 않는다", async () => {
    fakeServer([bookmark(1)]);
    renderPanel();

    const link = await screen.findByRole("link");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("AC-10: 비어 있으면 안내를 보여 준다", async () => {
    fakeServer([]);
    renderPanel();

    expect(
      await screen.findByText("저장한 링크가 없어요."),
    ).toBeInTheDocument();
  });

  it("AC-09: 저장하면 입력을 비우고 목록을 다시 받아 맨 위에 보인다", async () => {
    const server = fakeServer([bookmark(1)]);
    renderPanel();
    await screen.findByText("https://example.com/1");
    const before = server.listCalls("active");

    await userEvent.type(
      screen.getByLabelText("링크 주소"),
      "https://new.example",
    );
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() => expect(links()[0]).toBe("https://new.example"));
    expect(screen.getByLabelText("링크 주소")).toHaveValue("");
    expect(server.listCalls("active")).toBeGreaterThan(before);
  });

  it("AC-09·AC-13: 서버가 거부하면 그 문구를 alert로 보여 준다", async () => {
    const server = fakeServer([]);
    server.overrides["POST /api/bookmarks"] = () =>
      json(400, {
        code: "INVALID_URL",
        message: "올바른 링크 주소가 아니에요.",
        requestId: "r",
      });
    renderPanel();

    await userEvent.type(screen.getByLabelText("링크 주소"), "nope");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "올바른 링크 주소가 아니에요.",
    );
  });

  it("AC-09: 삭제했던 링크면 서버 문구와 [복구]를 보여 주고, 누르면 그 북마크를 복구한다", async () => {
    const server = fakeServer([bookmark(5, true)]);
    server.overrides["POST /api/bookmarks"] = () =>
      json(409, {
        code: "BOOKMARK_DELETED",
        message: "삭제한 링크예요. 복구할 수 있어요.",
        requestId: "r",
        bookmarkId: "id-5",
      });
    renderPanel();
    await screen.findByText("저장한 링크가 없어요.");

    await userEvent.type(
      screen.getByLabelText("링크 주소"),
      "https://example.com/5",
    );
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "삭제한 링크예요. 복구할 수 있어요.",
    );
    await userEvent.click(screen.getByRole("button", { name: "복구" }));

    await vi.waitFor(() => expect(links()).toEqual(["https://example.com/5"]));
    expect(
      server.calls.some(
        (c) => c.method === "POST" && c.path === "/api/bookmarks/id-5/restore",
      ),
    ).toBe(true);
  });

  it("AC-11·AC-12: 삭제하면 내 링크에서 빠지고 휴지통에 보이며, 휴지통에서 복구하면 돌아온다", async () => {
    fakeServer([bookmark(2), bookmark(1)]);
    renderPanel();
    await screen.findByText("https://example.com/2");

    await userEvent.click(
      screen.getByRole("button", { name: "삭제: https://example.com/2" }),
    );
    await vi.waitFor(() => expect(links()).toEqual(["https://example.com/1"]));

    await userEvent.click(screen.getByRole("button", { name: "휴지통" }));
    expect(screen.getByRole("button", { name: "휴지통" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await vi.waitFor(() => expect(links()).toEqual(["https://example.com/2"]));

    await userEvent.click(
      screen.getByRole("button", { name: "복구: https://example.com/2" }),
    );
    await vi.waitFor(() =>
      expect(screen.getByText("휴지통이 비어 있어요.")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "내 링크" }));
    await vi.waitFor(() =>
      expect(links()).toEqual([
        "https://example.com/2",
        "https://example.com/1",
      ]),
    );
  });

  it("AC-12·AC-13: 복구하려는 링크가 이미 저장돼 있으면 서버 문구를 보여 준다", async () => {
    const server = fakeServer([bookmark(1, true)]);
    server.overrides["POST /api/bookmarks/id-1/restore"] = () =>
      json(409, {
        code: "BOOKMARK_ALREADY_SAVED",
        message: "같은 링크가 이미 저장되어 있어요.",
        requestId: "r",
        bookmarkId: "id-9",
      });
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "휴지통" }));

    await userEvent.click(
      await screen.findByRole("button", {
        name: "복구: https://example.com/1",
      }),
    );

    const section = screen.getByRole("region", { name: "북마크" });
    expect(await within(section).findByRole("alert")).toHaveTextContent(
      "같은 링크가 이미 저장되어 있어요.",
    );
  });
});
