import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
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
  };
}

function renderHome(
  items: ReturnType<typeof link>[],
  nextCursor: string | null = null,
  openSave = false,
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
      <Home openSave={openSave} />
    </QueryClientProvider>,
  );
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
    const triage = await screen.findByRole("heading", { name: /정리할 링크/ });
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
      name: /정리할 링크/,
    });
    await screen.findByRole("link", { name: "site1.example" });
    expect(heading).not.toHaveTextContent("예시");
    expect(heading).toHaveTextContent("1개");
    expect(
      screen.queryByRole("button", { name: /카테고리 만들기/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "링크 저장" }),
    ).toBeInTheDocument();
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
    const card = await screen.findByRole("article", { name: "정리할 링크" });
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
    const card = await screen.findByRole("article", { name: "정리할 링크" });
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

describe("홈 미리보기", () => {
  it("샘플로 세 섹션과 카테고리 선택을 그리고, 저장하면 다음 카드로 넘어간다. 썸네일을 못 불러오면 아트워크로 대신한다", async () => {
    render(<HomePreview />);
    expect(screen.getByRole("heading", { name: /버킷/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /공유용 링크/ }),
    ).toBeInTheDocument();
    // 세 섹션 모두 제목 줄 끝에 "전체 보기"(목록 화면 전에는 준비 중)
    for (const section of ["정리할 링크", "버킷", "공유용 링크"]) {
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
    const card = screen.getByRole("article", { name: "정리할 링크" });
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
