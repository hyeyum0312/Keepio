import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkList } from "./BookmarkList";
import { SaveBookmarkForm } from "./SaveBookmarkForm";

type Thumb = { status: "pending" | "ready" | "failed"; url: string | null };

function item(n: number, thumbnail: Thumb, extra: object = {}) {
  return {
    id: `id-${n}`,
    url: `https://www.instagram.com/p/${n}/`,
    normalizedUrl: `https://www.instagram.com/p/${n}/`,
    createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    deletedAt: null,
    title: null,
    displayTitle: `레퍼런스 ${n}`,
    tags: [],
    thumbnail,
    ...extra,
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("링크 저장 시 제목·태그와 썸네일 (FEAT-010)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("AC-01·02: Enter·쉼표로 태그 칩을 만들고, 같은 이름은 하나로, 입력 중인 글자도 저장할 때 태그로 보낸다", async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
        bodies.push(JSON.parse(String(init.body)));
        return json(201, item(1, { status: "pending", url: null }));
      }),
    );
    wrap(<SaveBookmarkForm />);

    await userEvent.type(
      screen.getByLabelText("링크 주소"),
      "https://www.instagram.com/p/1/",
    );
    // 제목·태그는 "추가 정보 입력하기"를 펼쳐야 보인다(LINK-01)
    await userEvent.click(
      screen.getByRole("button", { name: "추가 정보 입력하기 (선택)" }),
    );
    await userEvent.type(screen.getByLabelText("제목 (선택)"), "랜딩 모션");
    const tagBox = screen.getByLabelText(/태그/, { selector: "input" });
    await userEvent.type(tagBox, "모션{Enter}Reel,reel,  REEL {Enter}랜딩");
    const chips = within(screen.getByRole("list", { name: "추가한 태그" }));
    expect(chips.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "모션×",
      "Reel×",
    ]);

    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() =>
      expect(bodies[0]).toEqual({
        url: "https://www.instagram.com/p/1/",
        title: "랜딩 모션",
        tags: ["모션", "Reel", "랜딩"],
      }),
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByRole("list", { name: "추가한 태그" })?.children,
      ).toHaveLength(0),
    );
  });

  it("AC-01: 빈 입력에서 Backspace는 마지막 태그를 지우고, 칩의 삭제 버튼으로도 지운다", async () => {
    wrap(<SaveBookmarkForm />);
    await userEvent.click(
      screen.getByRole("button", { name: "추가 정보 입력하기 (선택)" }),
    );
    const tagBox = screen.getByLabelText(/태그/, { selector: "input" });
    await userEvent.type(tagBox, "a{Enter}b{Enter}c{Enter}{Backspace}");
    await userEvent.click(screen.getByRole("button", { name: "태그 a 삭제" }));

    const chips = within(screen.getByRole("list", { name: "추가한 태그" }));
    expect(chips.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "b×",
    ]);
  });

  it("AC-04~07: 표시 제목·도메인·태그와 썸네일 상태(ready 이미지, pending 안내, failed 캡처 올리기)를 보여 준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json(200, {
          items: [
            item(
              1,
              {
                status: "ready",
                url: "/api/files/thumbnails/a.jpg?exp=1&sig=s",
              },
              {
                tags: [{ id: "t1", name: "모션" }],
              },
            ),
            item(2, { status: "pending", url: null }),
            item(3, { status: "failed", url: null }),
          ],
          nextCursor: null,
        }),
      ),
    );
    wrap(<BookmarkList status="active" />);

    const first = (
      await screen.findByRole("link", { name: "레퍼런스 1" })
    ).closest("li")!;
    // 장식 이미지(alt="")라 역할이 없다. 표시 제목이 이름 역할을 한다.
    // 불러오기 실패 감지(onError) 때문에 Next 이미지가 src를 절대 주소로 다시 쓴다
    expect(first.querySelector("img")?.getAttribute("src")).toMatch(
      /\/api\/files\/thumbnails\/a\.jpg\?exp=1&sig=s$/,
    );
    expect(within(first).getByText("www.instagram.com")).toBeInTheDocument();
    expect(within(first).getByText("#모션")).toBeInTheDocument();
    expect(screen.getByText("썸네일 가져오는 중")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "캡처 올리기: 레퍼런스 3" }),
    ).toBeInTheDocument();
    // 이미지가 이미 있어도 바꿀 수 있다(2026-11-21)
    expect(
      screen.getByRole("button", { name: "이미지 바꾸기: 레퍼런스 1" }),
    ).toBeInTheDocument();
  });

  it("AC-06: 캡처를 올리면 PUT으로 보내고 목록을 다시 받는다. 실패하면 서버 문구를 보여 준다", async () => {
    let uploaded = false;
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const path = new URL(String(input), "http://local").pathname;
        calls.push(`${init.method ?? "GET"} ${path}`);
        if (init.method === "PUT") {
          expect(init.body).toBeInstanceOf(FormData);
          if (!uploaded) {
            uploaded = true;
            return json(400, {
              code: "UNSUPPORTED_IMAGE",
              message: "JPG·PNG·WEBP·GIF 이미지만 올릴 수 있어요.",
              requestId: "r",
            });
          }
          return json(
            200,
            item(3, { status: "ready", url: "/x.jpg?exp=1&sig=s" }),
          );
        }
        return json(200, {
          items: [
            item(
              3,
              uploaded
                ? { status: "ready", url: "/x.jpg?exp=1&sig=s" }
                : { status: "failed", url: null },
            ),
          ],
          nextCursor: null,
        });
      }),
    );
    const { container } = wrap(<BookmarkList status="active" />);
    await screen.findByRole("button", { name: "캡처 올리기: 레퍼런스 3" });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "a.jpg", {
      type: "image/jpeg",
    });
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await userEvent.upload(input, file);
    expect(
      await screen.findByText("JPG·PNG·WEBP·GIF 이미지만 올릴 수 있어요."),
    ).toBeInTheDocument();

    await userEvent.upload(input, file);
    await vi.waitFor(() =>
      expect(
        calls.filter((c) => c === "GET /api/bookmarks").length,
      ).toBeGreaterThanOrEqual(2),
    );
    expect(calls).toContain("PUT /api/bookmarks/id-3/thumbnail");
  });
});
