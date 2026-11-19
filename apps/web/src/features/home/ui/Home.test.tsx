import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home } from "./Home";
import { HomePreview } from "./HomePreview";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function link(n: number) {
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
  };
}

function renderHome(
  items: ReturnType<typeof link>[],
  nextCursor: string | null = null,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(200, { items, nextCursor })),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
  );
}

describe("홈 (FEAT-009)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("정리할 링크에 썸네일을 보여 주고, 전체 보기는 전체 링크로 간다", async () => {
    const ready = {
      ...link(1),
      thumbnail: {
        status: "ready",
        url: "/api/files/thumbnails/a.png?exp=1&sig=s",
      },
    };
    renderHome([ready]);
    await screen.findByRole("heading", { name: /정리할 링크/ });
    const card = screen.getByRole("article", { name: "정리할 링크" });
    expect(card.querySelector("img")?.getAttribute("src")).toContain(
      "/api/files/thumbnails/a.png",
    );
    expect(screen.getByRole("link", { name: "전체 보기 →" })).toHaveAttribute(
      "href",
      "/links",
    );
  });

  it("카테고리가 없는 링크를 정리할 링크로 한 장씩 보여 주고, 건너뛰면 다음 링크가 나온다", async () => {
    renderHome([link(1), link(2)]);
    expect(
      await screen.findByRole("link", { name: "site1.example" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /정리할 링크/ }),
    ).toHaveTextContent("2개");
    await userEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
    expect(
      screen.getByRole("link", { name: "site2.example" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /정리할 링크/ }),
    ).toHaveTextContent("1개");
  });

  it("모든 링크를 건너뛰면 정리할 링크 섹션이 사라진다", async () => {
    renderHome([link(1)]);
    await userEvent.click(
      await screen.findByRole("button", { name: "건너뛰기" }),
    );
    expect(
      screen.queryByRole("heading", { name: /정리할 링크/ }),
    ).not.toBeInTheDocument();
  });

  it("다음 페이지가 남아 있으면 개수를 세지 않는다(일부로 세지 않음)", async () => {
    renderHome([link(1), link(2)], "next");
    await screen.findByRole("link", { name: "site1.example" });
    expect(
      screen.getByRole("heading", { name: /정리할 링크/ }),
    ).not.toHaveTextContent("개");
  });

  it("서버 기능이 없는 버킷·공유한 페이지 섹션은 그리지 않는다", async () => {
    renderHome([link(1)]);
    await screen.findByRole("link", { name: "site1.example" });
    expect(
      screen.queryByRole("heading", { name: /버킷/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /공유한 페이지/ }),
    ).not.toBeInTheDocument();
  });

  it("링크 저장을 누르면 저장 칸이 열린다", async () => {
    renderHome([]);
    await userEvent.click(screen.getByRole("button", { name: "+ 링크 저장" }));
    expect(screen.getByLabelText("링크 주소")).toBeInTheDocument();
  });
});

describe("홈 미리보기", () => {
  it("샘플로 세 섹션과 카테고리 칩을 그리고, 칩을 누르면 다음 카드로 넘어간다", async () => {
    render(<HomePreview />);
    expect(screen.getByRole("heading", { name: /버킷/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /공유한 페이지/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("[미리보기] 랜딩 페이지 레퍼런스"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "여행" }));
    expect(screen.getByText("[미리보기] 모션 가이드")).toBeInTheDocument();
  });
});
