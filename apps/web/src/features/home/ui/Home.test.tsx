import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home } from "./Home";
import { HomePreview } from "./HomePreview";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

type Thumb = {
  status: "pending" | "ready" | "failed";
  url: string | null;
  sourceUrl?: string | null;
};

function link(n: number): {
  id: string;
  url: string;
  normalizedUrl: string;
  createdAt: string;
  deletedAt: null;
  title: null;
  displayTitle: string;
  tags: never[];
  thumbnail: Thumb;
  faviconUrl?: string | null;
  categoryId?: string | null;
} {
  return {
    id: `id-${n}`,
    url: `https://site${n}.example/page`,
    normalizedUrl: `https://site${n}.example/page`,
    createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    deletedAt: null,
    // FEAT-010 필드. 제목이 없으면 서버가 도메인을 표시 제목으로 준다
    title: null,
    displayTitle: `site${n}.example`,
    tags: [],
    thumbnail: { status: "failed", url: null },
    // FEAT-008. 카테고리를 정하지 않은 링크(미분류)
    categoryId: null,
  };
}

type Category = { id: string; name: string; bookmarkCount: number };

// 서버 흉내: 경로로 나눈다(링크 목록·카테고리 목록·카테고리 만들기·링크 수정)
function renderHome(
  items: ReturnType<typeof link>[],
  nextCursor: string | null = null,
  openSave = false,
  categories: Category[] = [],
) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const path = new URL(String(input), "http://local").pathname;
      const body =
        typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ method, path, body });
      if (path === "/api/categories") {
        if (method === "POST") {
          const name = (body as { name: string }).name;
          return json(201, { id: "c-new", name, bookmarkCount: 0 });
        }
        return json(200, { items: categories });
      }
      if (method === "PATCH") return json(200, items[0]);
      return json(200, { items, nextCursor });
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    calls,
    ...render(
      <QueryClientProvider client={client}>
        <Home openSave={openSave} />
      </QueryClientProvider>,
    ),
  };
}

// 화면 폭 흉내: 모바일이면 (max-width: 767px)가 맞는다
function stubWidth(mobile: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width") ? mobile : !mobile,
    addEventListener() {},
    removeEventListener() {},
  }));
}

describe("홈 (FEAT-009)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("링크가 하나도 없으면 예시로 채운다: 세 섹션에 예시 표시, 카테고리 만들기, 버킷·공유용 링크 예시", async () => {
    renderHome([]);
    const triage = await screen.findByRole("heading", {
      name: /최근 추가한 링크/,
    });
    expect(triage).toHaveTextContent("예시");
    expect(screen.getByRole("heading", { name: /버킷/ })).toHaveTextContent(
      "예시",
    );
    expect(
      screen.getByRole("heading", { name: /공유용 링크/ }),
    ).toHaveTextContent("예시");
    expect(
      screen.getByText("저장한 링크는 여기서 하나씩 정리해요"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /카테고리 만들기/ }),
    ).toHaveAttribute("aria-disabled", "true");
    // 버킷 카드와 공유용 링크에 같은 예시 이름이 있다
    expect(screen.getAllByText("여름 여행 레퍼런스")).toHaveLength(2);
    // 예시 공유용 링크는 누를 것이 없다
    expect(
      screen.queryByRole("button", { name: "링크 복사" }),
    ).not.toBeInTheDocument();
    // PC 저장 카드는 늘 맨 위에 있다
    expect(
      screen.getByRole("region", { name: "링크 저장" }),
    ).toBeInTheDocument();
  });

  it("링크가 있으면 예시를 보여 주지 않고 개수를 보여 준다", async () => {
    renderHome([link(1)]);
    const heading = await screen.findByRole("heading", {
      name: /최근 추가한 링크/,
    });
    await screen.findByRole("link", { name: "site1.example" });
    expect(heading).not.toHaveTextContent("예시");
    expect(heading).toHaveTextContent("1개");
    expect(
      screen.getByRole("region", { name: "링크 저장" }),
    ).toBeInTheDocument();
  });

  it("카테고리가 하나도 없으면 [카테고리 만들기] [저장] [건너뛰기] 순서. 저장은 만들기 전까지 누를 수 없다 (FEAT-008 AC-13)", async () => {
    renderHome([link(1)]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    const names = within(card)
      .getAllByRole("button")
      .map((b) => b.textContent?.trim());
    expect(names).toEqual(["카테고리 만들기", "저장", "건너뛰기"]);
    // 만들기는 누를 수 있고, 고를 카테고리가 없으니 저장만 막는다
    expect(
      within(card).getByRole("button", { name: "카테고리 만들기" }),
    ).not.toHaveAttribute("aria-disabled");
    expect(within(card).getByRole("button", { name: /^저장/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("FEAT-008 AC-13: 카테고리를 만들면 POST한 뒤 그 링크에 바로 적용한다", async () => {
    const { calls } = renderHome([link(1)]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });

    await userEvent.click(
      within(card).getByRole("button", { name: "카테고리 만들기" }),
    );
    await userEvent.type(
      within(card).getByRole("textbox", { name: "새 카테고리 이름" }),
      "브랜딩{Enter}",
    );

    await waitFor(() =>
      expect(
        calls.some((c) => c.method === "POST" && c.path === "/api/categories"),
      ).toBe(true),
    );
    const patch = await waitFor(() => {
      const found = calls.find((c) => c.method === "PATCH");
      expect(found).toBeDefined();
      return found!;
    });
    expect(patch.path).toBe("/api/bookmarks/id-1");
    expect(patch.body).toEqual({ categoryId: "c-new" });
  });

  it("미분류 링크를 먼저 보여 준다 (2026-11-22)", async () => {
    // 최근 저장 순으로는 id-1(카테고리 있음)이 먼저지만, 미분류인 id-2가 앞에 와야 한다
    renderHome([{ ...link(1), categoryId: "c-1" }, link(2)], null, false, [
      { id: "c-1", name: "디자인", bookmarkCount: 1 },
    ]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    expect(within(card).getByRole("link")).toHaveAttribute(
      "href",
      "https://site2.example/page",
    );
  });

  it("FEAT-008 AC-09·D-19: 카테고리가 있으면 고르기가 보이고, 이미 정한 카테고리가 골라진 채로 나온다", async () => {
    renderHome([{ ...link(1), categoryId: "c-2" }], null, false, [
      { id: "c-1", name: "디자인", bookmarkCount: 0 },
      { id: "c-2", name: "여행", bookmarkCount: 1 },
    ]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    const select = await waitFor(() =>
      within(card).getByRole("combobox", { name: "카테고리" }),
    );
    expect(select).toHaveValue("c-2");
    expect(
      within(card).getByRole("option", { name: "새 카테고리" }),
    ).toBeInTheDocument();
  });

  it("카테고리를 고를 수 있으면 [카테고리 선택] [저장] [건너뛰기] 순서 (미리보기)", async () => {
    render(<HomePreview />);
    const card = screen.getByRole("article", { name: "최근 추가한 링크" });
    expect(
      within(card)
        .getAllByRole("button")
        .map((b) => b.textContent?.trim()),
    ).toEqual(["저장", "건너뛰기"]);
    expect(within(card).getByLabelText("카테고리")).toBeInTheDocument();
  });

  it("링크 저장 카드는 링크가 있어도 맨 위에 있다", async () => {
    renderHome([link(1)]);
    await screen.findByRole("link", { name: "site1.example" });
    expect(
      screen.getByRole("region", { name: "링크 저장" }),
    ).toBeInTheDocument();
  });

  it("카테고리가 없는 링크를 최근 추가한 링크로 한 장씩 보여 주고, 건너뛰면 다음 링크가 나온다", async () => {
    renderHome([link(1), link(2)]);
    expect(
      await screen.findByRole("link", { name: "site1.example" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /최근 추가한 링크/ }),
    ).toHaveTextContent("2개");
    await userEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
    expect(
      screen.getByRole("link", { name: "site2.example" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /최근 추가한 링크/ }),
    ).toHaveTextContent("1개");
  });

  it("모든 링크를 건너뛰면 최근 추가한 링크 섹션이 사라진다", async () => {
    renderHome([link(1)]);
    await userEvent.click(
      await screen.findByRole("button", { name: "건너뛰기" }),
    );
    expect(
      screen.queryByRole("heading", { name: /최근 추가한 링크/ }),
    ).not.toBeInTheDocument();
  });

  it("다음 페이지가 남아 있으면 개수를 세지 않는다(일부로 세지 않음)", async () => {
    renderHome([link(1), link(2)], "next");
    await screen.findByRole("link", { name: "site1.example" });
    expect(
      screen.getByRole("heading", { name: /최근 추가한 링크/ }),
    ).not.toHaveTextContent("개");
  });

  it("서버 기능이 없는 버킷·공유용 링크 섹션은 그리지 않는다", async () => {
    renderHome([link(1)]);
    await screen.findByRole("link", { name: "site1.example" });
    expect(
      screen.queryByRole("heading", { name: /버킷/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /공유용 링크/ }),
    ).not.toBeInTheDocument();
  });

  it("모바일: + 버튼으로 시트를 열고, 닫기·Esc로 닫는다. 시트가 열린 동안 저장 폼은 하나뿐이다", async () => {
    stubWidth(true);
    renderHome([link(1)]);
    await screen.findByRole("link", { name: "site1.example" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "링크 추가" }));
    const sheet = screen.getByRole("dialog", { name: "링크 추가" });
    expect(screen.getAllByLabelText("링크 주소")).toHaveLength(1);
    expect(sheet).toContainElement(screen.getByLabelText("링크 주소"));
    expect(screen.getByLabelText("링크 주소")).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "링크 추가" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("사이드바 링크 추가(/?save=1): 모바일이면 시트를 연 채로 시작하고, PC는 맨 위 저장 카드 그대로다", async () => {
    stubWidth(true);
    const { unmount } = renderHome([link(1)], null, true);
    expect(
      await screen.findByRole("dialog", { name: "링크 추가" }),
    ).toBeInTheDocument();
    unmount();
    stubWidth(false);
    renderHome([link(1)], null, true);
    await screen.findByRole("link", { name: "site1.example" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "링크 저장" }),
    ).toBeInTheDocument();
  });

  it("처음 온 사용자(예시 화면)에게만 + 버튼 옆 안내를 보여 주고, 닫으면 다시 나오지 않는다", async () => {
    const first = renderHome([]);
    expect(
      await screen.findByText("여기서 첫 링크를 저장해 보세요"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "안내 닫기" }));
    expect(
      screen.queryByText("여기서 첫 링크를 저장해 보세요"),
    ).not.toBeInTheDocument();
    first.unmount();
    renderHome([]);
    await screen.findByText("저장한 링크는 여기서 하나씩 정리해요");
    expect(
      screen.queryByText("여기서 첫 링크를 저장해 보세요"),
    ).not.toBeInTheDocument();
  });

  it("링크가 있으면 안내를 보여 주지 않는다", async () => {
    renderHome([link(1)]);
    await screen.findByRole("link", { name: "site1.example" });
    expect(
      screen.queryByText("여기서 첫 링크를 저장해 보세요"),
    ).not.toBeInTheDocument();
  });

  it("썸네일이 있으면 그 이미지를, 없으면 링크마다 정해진 아트워크를 보여 준다", async () => {
    renderHome([
      {
        ...link(1),
        thumbnail: {
          status: "ready",
          url: "/api/files/thumbnails/t.jpg?exp=1&sig=s",
        },
      },
    ]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    expect(card.querySelector("img")?.getAttribute("src")).toMatch(
      /\/api\/files\/thumbnails\/t\.jpg/,
    );
  });

  it("보관 파일을 못 불러오면 링크 페이지의 원본 이미지로, 그것도 안 되면 아트워크로 바꾼다 (FEAT-010 AC-11)", async () => {
    renderHome([
      {
        ...link(1),
        thumbnail: {
          status: "ready",
          url: "/api/files/thumbnails/t.jpg?exp=1&sig=s",
          sourceUrl: "https://i.ytimg.com/vi/x/hq.jpg",
        },
      },
    ]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    fireEvent.error(card.querySelector("img")!);
    const original = card.querySelector("img")!;
    expect(original.getAttribute("src")).toBe(
      "https://i.ytimg.com/vi/x/hq.jpg",
    );
    expect(original.getAttribute("referrerpolicy")).toBe("no-referrer");
    fireEvent.error(original);
    expect(card.querySelector("img")?.getAttribute("src")).toMatch(
      /bucket-art/,
    );
  });
});

describe("파비콘 (FEAT-010 AC-15)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("보여 줄 썸네일이 없으면 아트워크 위에 페이지 아이콘을, 못 불러오면 /favicon.ico를, 그것도 안 되면 아이콘 없이 보여 준다", async () => {
    renderHome([
      { ...link(1), faviconUrl: "https://cdn.site1.example/apple.png" },
    ]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    const tile = () => card.querySelector('[data-testid="favicon-tile"]');
    const icon = () => tile()?.querySelector("img");
    expect(icon()?.getAttribute("src")).toBe(
      "https://cdn.site1.example/apple.png",
    );
    expect(icon()?.getAttribute("referrerpolicy")).toBe("no-referrer");
    // 불러오기 전에는 보이지 않는다
    expect(tile()?.className).toContain("opacity-0");
    fireEvent.load(icon()!);
    await waitFor(() => expect(tile()?.className).toContain("opacity-100"));

    fireEvent.error(icon()!);
    expect(icon()?.getAttribute("src")).toBe(
      "https://site1.example/favicon.ico",
    );
    fireEvent.error(icon()!);
    expect(tile()).toBeNull();
    // 아트워크는 그대로
    expect(card.querySelector("img")?.getAttribute("src")).toMatch(
      /bucket-art/,
    );
  });

  it("썸네일이 보이면 파비콘을 올리지 않는다", async () => {
    renderHome([
      {
        ...link(1),
        faviconUrl: "https://cdn.site1.example/apple.png",
        thumbnail: {
          status: "ready",
          url: "/api/files/thumbnails/t.jpg?exp=1&sig=s",
        },
      },
    ]);
    const card = await screen.findByRole("article", {
      name: "최근 추가한 링크",
    });
    expect(card.querySelector('[data-testid="favicon-tile"]')).toBeNull();
  });
});

describe("홈 미리보기", () => {
  it("샘플로 세 섹션과 카테고리 선택을 그리고, 저장하면 다음 카드로 넘어간다. 썸네일을 못 불러오면 아트워크로 대신한다", async () => {
    render(<HomePreview />);
    expect(screen.getByRole("heading", { name: /버킷/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /공유용 링크/ }),
    ).toBeInTheDocument();
    // 세 섹션 모두 제목 줄 끝에 "전체 보기"(목록 화면 전에는 준비 중)
    // 최근 추가한 링크의 전체 보기는 내 링크(/links)로 간다(2026-11-21)
    expect(
      screen.getByRole("link", { name: "최근 추가한 링크 전체 보기" }),
    ).toHaveAttribute("href", "/links");
    for (const section of ["버킷", "공유용 링크"]) {
      expect(
        screen.getByRole("link", { name: `${section} 전체 보기 (준비 중)` }),
      ).toHaveAttribute("aria-disabled", "true");
    }
    // 버킷 카드: 이름과 설명 한 줄, 링크 개수는 없다. 설명이 없는 버킷은 설명 줄을 그리지 않는다
    expect(screen.getByText("[미리보기] 개발 레퍼런스")).toBeInTheDocument();
    expect(
      screen.getByText("프레임워크 문서와 좋은 예제 모음"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/개 링크/)).not.toBeInTheDocument();
    const card = screen.getByRole("article", { name: "최근 추가한 링크" });
    const img = card.querySelector("img")!;
    fireEvent.error(img);
    expect(card.querySelector("img")?.getAttribute("src")).toMatch(
      /bucket-art/,
    );
    await userEvent.selectOptions(screen.getByLabelText("카테고리"), "개발");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByText("[미리보기] 모션 가이드")).toBeInTheDocument();
  });
});

describe("버킷 기본 썸네일", () => {
  it("고른 썸네일이 없으면 중성 톤 8장 중 버킷 ID로 정한 그림을, 같은 ID면 늘 같은 그림을 쓴다", async () => {
    const { bucketArtFor, DEFAULT_BUCKET_ART, BUCKET_ART } =
      await import("../lib/bucket-art");
    const pool: string[] = DEFAULT_BUCKET_ART.map((k) => BUCKET_ART[k]);
    const a = bucketArtFor({ id: "bucket-abc" });
    expect(pool).toContain(a);
    expect(bucketArtFor({ id: "bucket-abc" })).toBe(a);
    expect(bucketArtFor({ id: "bucket-abc", art: "soft-coral" })).toBe(
      BUCKET_ART["soft-coral"],
    );
  });

  it("예시 버킷 3개는 서로 다른 그림이다", async () => {
    const { bucketArtFor } = await import("../lib/bucket-art");
    const { SAMPLE_BUCKETS } = await import("../lib/sample-data");
    expect(new Set(SAMPLE_BUCKETS.map(bucketArtFor)).size).toBe(3);
  });
});
