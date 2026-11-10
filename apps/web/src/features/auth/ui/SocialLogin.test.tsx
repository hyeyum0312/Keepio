import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { navigateTo } from "../lib/navigate";
import { getAuthStatus, resetSessionForTest } from "../model/session-store";
import { OAuthCallback } from "./OAuthCallback";
import { OAuthFailureAlert } from "./OAuthFailureAlert";
import { SocialLoginButtons } from "./SocialLoginButtons";

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => searchParams,
}));
vi.mock("../lib/navigate", () => ({ navigateTo: vi.fn() }));

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

function stubFetch(routes: Record<string, () => Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input), "http://local").pathname;
      const route = routes[path];
      if (!route) throw new Error(`unexpected request ${path}`);
      return route();
    }),
  );
}

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("소셜 로그인 화면 (FEAT-004)", () => {
  beforeEach(() => {
    resetSessionForTest();
    replace.mockClear();
    vi.mocked(navigateTo).mockClear();
    searchParams = new URLSearchParams();
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("AC-11: 서버가 켠 제공자 버튼만 보이고, 누르면 API 시작 주소로 페이지를 이동한다", async () => {
    stubFetch({
      "/api/auth/oauth/providers": () => json(200, { providers: ["google"] }),
    });
    renderWithClient(<SocialLoginButtons />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Google로 계속하기" }),
    );

    expect(
      screen.queryByRole("button", { name: "카카오로 계속하기" }),
    ).not.toBeInTheDocument();
    expect(navigateTo).toHaveBeenCalledWith("/api/auth/oauth/google/start");
  });

  it("AC-11: 켜진 제공자가 없거나 목록을 못 받으면 버튼을 그리지 않는다", async () => {
    stubFetch({
      "/api/auth/oauth/providers": () => json(200, { providers: [] }),
    });
    const { container } = renderWithClient(<SocialLoginButtons />);

    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("AC-12: 콜백 화면은 refresh로 로그인 상태를 받고 홈으로 간다", async () => {
    stubFetch({
      "/api/auth/refresh": () =>
        json(200, { accessToken: "access", expiresIn: 900 }),
    });

    renderWithClient(<OAuthCallback />);

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(getAuthStatus()).toBe("authenticated");
  });

  it("AC-12: 콜백 화면에서 refresh가 실패하면 /login?oauth=failed", async () => {
    stubFetch({
      "/api/auth/refresh": () =>
        json(401, {
          code: "SESSION_EXPIRED",
          message: "다시 로그인해 주세요.",
        }),
    });

    renderWithClient(<OAuthCallback />);

    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?oauth=failed"),
    );
  });

  it("AC-13: oauth=failed면 고정 문구를 보여 주고 주소에서 값을 지운다", () => {
    window.history.replaceState(null, "", "/login?oauth=failed");
    searchParams = new URLSearchParams(window.location.search);

    render(<OAuthFailureAlert />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "소셜 로그인에 실패했어요. 다시 시도해 주세요.",
    );
    expect(window.location.search).toBe("");
  });

  it("AC-13: 주소에 실린 문구는 보여 주지 않는다(임의 문구 링크 방지)", () => {
    window.history.replaceState(
      null,
      "",
      "/login?oauth=%EA%B3%84%EC%A0%95%EC%9D%B4%20%EC%A0%95%EC%A7%80%EB%90%90%EC%96%B4%EC%9A%94",
    );
    searchParams = new URLSearchParams(window.location.search);

    render(<OAuthFailureAlert />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/정지/)).not.toBeInTheDocument();
  });
});
