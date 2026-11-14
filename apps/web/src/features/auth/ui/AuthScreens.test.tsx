import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import {
  clearSession,
  getAccessToken,
  getAuthStatus,
  resetSessionForTest,
  setSession,
} from "../model/session-store";
import { AccountHeader, displayName } from "./AccountHeader";
import { AuthSwitch } from "./AuthSwitch";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { RequireAuth } from "./RequireAuth";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SignupForm } from "./SignupForm";
import { VerifyEmail } from "./VerifyEmail";

const replace = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => searchParams,
}));

const TOKEN = "t".repeat(43);

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

type Route = (init: RequestInit) => Response | Promise<Response>;

// 경로별 응답을 정하고 요청 본문을 기록한다
function stubApi(routes: Record<string, Route>) {
  const requests: { path: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const path = new URL(String(input), "http://local").pathname;
      requests.push({
        path,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      // 로그인·가입 화면의 소셜 버튼 목록(FEAT-004). 테스트가 따로 정하지 않으면 빈 목록
      const route =
        routes[path] ??
        (path === "/api/auth/oauth/providers"
          ? () => json(200, { providers: [] })
          : undefined);
      if (!route) throw new Error(`unexpected request ${path}`);
      return route(init);
    }),
  );
  return {
    requests,
    count: (path: string) => requests.filter((r) => r.path === path).length,
    bodyOf: (path: string) => requests.find((r) => r.path === path)?.body,
  };
}

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

// 주소창에 토큰이 있는 상태로 시작한다
function openWithToken(path: string) {
  window.history.replaceState(null, "", `${path}?token=${TOKEN}`);
  searchParams = new URLSearchParams(window.location.search);
}

describe("인증 화면 (FEAT-006)", () => {
  beforeEach(() => {
    resetSessionForTest();
    window.localStorage.clear();
    replace.mockClear();
    push.mockClear();
    searchParams = new URLSearchParams();
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("로그인", () => {
    // FEAT-007 AC-02: 이메일 입력은 이메일 모드에서만 보인다
    beforeEach(() => {
      searchParams = new URLSearchParams("method=email");
    });

    it("FEAT-007 AC-01: 첫 화면에는 이메일 입력이 없고, [이메일로 로그인]은 이메일 모드 주소로 이동한다", async () => {
      searchParams = new URLSearchParams();
      stubApi({});
      renderWithClient(<LoginForm />);

      expect(screen.queryByLabelText("이메일")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute(
        "href",
        "/signup",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "이메일로 로그인" }),
      );
      expect(push).toHaveBeenCalledWith("/login?method=email");
    });

    it("FEAT-007 AC-03: 마지막에 이메일로 로그인했으면 [이메일로 로그인]에 최근 사용 배지가 붙는다", () => {
      searchParams = new URLSearchParams();
      window.localStorage.setItem("keepio.lastLoginMethod", "email");
      stubApi({});
      renderWithClient(<LoginForm />);

      expect(screen.getByText("최근 사용")).toBeInTheDocument();
    });

    it("AC-09: 성공하면 토큰을 메모리에 두고 홈으로 이동한다", async () => {
      const api = stubApi({
        "/api/auth/login": () =>
          json(200, { accessToken: "access", expiresIn: 900 }),
      });
      renderWithClient(<LoginForm />);

      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText("비밀번호"), "correct horse");
      await userEvent.click(screen.getByRole("button", { name: "로그인" }));

      await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
      expect(getAccessToken()).toBe("access");
      expect(api.bodyOf("/api/auth/login")).toEqual({
        email: "user@example.com",
        password: "correct horse",
      });
      // FEAT-007 AC-03: 저장소에는 방법 이름만(토큰 없음, FEAT-006 AC-01)
      expect(window.localStorage.length).toBe(1);
      expect(window.localStorage.getItem("keepio.lastLoginMethod")).toBe(
        "email",
      );
      expect(window.sessionStorage.length).toBe(0);
    });

    it("AC-09·AC-14: 실패하면 서버 문구를 그대로 alert로 보여 주고 입력과 연결한다", async () => {
      stubApi({
        "/api/auth/login": () =>
          json(401, {
            code: "INVALID_CREDENTIALS",
            message: "이메일 또는 비밀번호가 맞지 않아요.",
            requestId: "r",
          }),
      });
      renderWithClient(<LoginForm />);

      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText("비밀번호"), "wrong");
      await userEvent.click(screen.getByRole("button", { name: "로그인" }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("이메일 또는 비밀번호가 맞지 않아요.");
      expect(screen.getByLabelText("이메일")).toHaveAttribute(
        "aria-describedby",
        alert.id,
      );
      expect(getAuthStatus()).not.toBe("authenticated");
    });

    it("AC-13: 요청 중에는 제출 버튼이 비활성이다", async () => {
      let respond!: () => void;
      stubApi({
        "/api/auth/login": () =>
          new Promise((resolve) => {
            respond = () =>
              resolve(json(200, { accessToken: "a", expiresIn: 900 }));
          }),
      });
      renderWithClient(<LoginForm />);
      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText("비밀번호"), "correct horse");

      await userEvent.click(screen.getByRole("button", { name: "로그인" }));

      expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
      await act(async () => respond());
    });

    it("서버에 연결하지 못하면 고정 문구를 보여 준다", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      );
      renderWithClient(<LoginForm />);

      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText("비밀번호"), "correct horse");
      await userEvent.click(screen.getByRole("button", { name: "로그인" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    });
  });

  describe("가입·비밀번호 찾기", () => {
    async function agreeAll() {
      for (const name of [
        /만 14세 이상/,
        /이용약관 동의/,
        /개인정보 수집·이용 동의/,
      ]) {
        await userEvent.click(screen.getByRole("checkbox", { name }));
      }
    }

    it("FEAT-007 AC-07: 필수 동의 3개를 모두 체크해야 가입하기가 활성이다", async () => {
      stubApi({});
      renderWithClient(<SignupForm />);
      const submitButton = screen.getByRole("button", { name: "가입하기" });

      expect(submitButton).toBeDisabled();
      await userEvent.click(
        screen.getByRole("checkbox", { name: /만 14세 이상/ }),
      );
      await userEvent.click(
        screen.getByRole("checkbox", { name: /이용약관 동의/ }),
      );
      expect(submitButton).toBeDisabled();
      await userEvent.click(
        screen.getByRole("checkbox", { name: /개인정보 수집·이용 동의/ }),
      );
      expect(submitButton).toBeEnabled();
    });

    it("AC-07: 가입이 접수되면 인증 메일 안내를 보여 준다", async () => {
      stubApi({ "/api/auth/signup": () => json(202) });
      renderWithClient(<SignupForm />);

      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText("비밀번호"), "correct horse");
      await agreeAll();
      await userEvent.click(screen.getByRole("button", { name: "가입하기" }));

      expect(await screen.findByRole("status")).toHaveTextContent(
        "user@example.com으로 인증 메일을 보냈어요",
      );
      // FEAT-007 AC-08: 재발송은 60초 대기 후 활성
      expect(
        screen.getByRole("button", { name: "메일 다시 보내기 (60초)" }),
      ).toBeDisabled();
      expect(
        screen.getByRole("link", { name: "로그인하러 가기" }),
      ).toHaveAttribute("href", "/login?method=email");
    });

    it("AC-07: 서버가 거부하면 그 문구를 보여 준다", async () => {
      stubApi({
        "/api/auth/signup": () =>
          json(400, {
            code: "WEAK_PASSWORD",
            message: "비밀번호는 8자 이상 128자 이하로 입력해 주세요.",
            requestId: "r",
          }),
      });
      renderWithClient(<SignupForm />);

      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText("비밀번호"), "short");
      await agreeAll();
      await userEvent.click(screen.getByRole("button", { name: "가입하기" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "비밀번호는 8자 이상 128자 이하로 입력해 주세요.",
      );
    });

    it("AC-10: 비밀번호 찾기는 가입 여부와 무관한 안내를 보여 준다", async () => {
      stubApi({ "/api/auth/password-reset": () => json(202) });
      renderWithClient(<ForgotPasswordForm />);

      await userEvent.type(
        screen.getByLabelText("이메일"),
        "anyone@example.com",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "재설정 메일 받기" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "가입된 이메일이면",
      );
    });
  });

  describe("메일 링크", () => {
    it("AC-08: 주소의 토큰을 즉시 지우고, StrictMode에서도 인증 요청은 1번만 보낸다", async () => {
      openWithToken("/verify-email");
      const api = stubApi({ "/api/auth/email-verification": () => json(204) });

      renderWithClient(
        <StrictMode>
          <VerifyEmail />
        </StrictMode>,
      );

      expect(
        await screen.findByText("이메일 인증이 끝났어요"),
      ).toBeInTheDocument();
      expect(window.location.search).toBe("");
      expect(api.count("/api/auth/email-verification")).toBe(1);
      expect(api.bodyOf("/api/auth/email-verification")).toEqual({
        token: TOKEN,
      });
    });

    it("AC-08: 실패하면 서버 문구와 재발송 입력을 보여 준다", async () => {
      openWithToken("/verify-email");
      stubApi({
        "/api/auth/email-verification": () =>
          json(400, {
            code: "INVALID_TOKEN",
            message:
              "링크가 만료되었거나 이미 사용되었어요. 다시 요청해 주세요.",
            requestId: "r",
          }),
      });

      renderWithClient(<VerifyEmail />);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "링크가 만료되었거나",
      );
      expect(
        screen.getByLabelText("인증 메일 다시 받을 이메일"),
      ).toBeInTheDocument();
    });

    it("AC-11: 재설정은 주소에서 지운 토큰과 새 비밀번호를 보내고, 완료되면 로그인 안내", async () => {
      openWithToken("/reset-password");
      const api = stubApi({
        "/api/auth/password-reset/confirm": () => json(204),
      });
      renderWithClient(<ResetPasswordForm />);
      expect(window.location.search).toBe("");

      await userEvent.type(
        screen.getByLabelText(/새 비밀번호/),
        "brand new password",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "비밀번호 바꾸기" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "다시 로그인해 주세요",
      );
      expect(api.bodyOf("/api/auth/password-reset/confirm")).toEqual({
        token: TOKEN,
        newPassword: "brand new password",
      });
    });
  });

  describe("보호 화면·로그아웃", () => {
    it("AC-06: 로그인 확인 중에는 로딩만 보여 주고 이동하지 않는다", () => {
      renderWithClient(
        <RequireAuth>
          <p>비밀 내용</p>
        </RequireAuth>,
      );

      expect(screen.getByRole("status")).toHaveTextContent("불러오는 중");
      expect(screen.queryByText("비밀 내용")).not.toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });

    it("AC-05: 보호 화면(RequireAuth)에서 비로그인이 되면 /login으로 보낸다", () => {
      renderWithClient(
        <RequireAuth>
          <p>비밀 내용</p>
        </RequireAuth>,
      );

      act(() => clearSession());

      expect(replace).toHaveBeenCalledWith("/login");
      expect(screen.queryByText("비밀 내용")).not.toBeInTheDocument();
    });

    it("AC-06·AC-12: 홈은 확인 중 로딩, 비로그인이면 랜딩, 로그인이면 계정 화면을 보여 준다", () => {
      renderWithClient(
        <AuthSwitch authenticated={<p>계정 화면</p>} anonymous={<p>랜딩</p>} />,
      );
      expect(screen.getByRole("status")).toHaveTextContent("불러오는 중");

      act(() => clearSession());
      expect(screen.getByText("랜딩")).toBeInTheDocument();

      act(() => setSession("access"));
      expect(screen.getByText("계정 화면")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });

    it("AC-12: 로그인 상태면 my-아이디와 인증 전 안내를 보여 주고, 로그아웃하면 같은 주소에서 랜딩이 보인다", async () => {
      setSession("access");
      const api = stubApi({
        "/api/me": () =>
          json(200, {
            id: "u1",
            email: "user@example.com",
            emailVerified: false,
          }),
        "/api/auth/logout": () => json(204),
      });
      renderWithClient(
        <AuthSwitch
          authenticated={<AccountHeader />}
          anonymous={<p>랜딩</p>}
        />,
      );

      expect(await screen.findByText("my-user")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "이메일 인증 전이에요",
      );

      await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));

      expect(await screen.findByText("랜딩")).toBeInTheDocument();
      expect(getAuthStatus()).toBe("anonymous");
      expect(getAccessToken()).toBeNull();
      expect(api.count("/api/auth/logout")).toBe(1);
      expect(replace).not.toHaveBeenCalled();
    });
  });
});

describe("displayName", () => {
  it("AC-12: 이메일이 있으면 @ 앞부분, 없으면 계정 ID 앞 8자리에 my-를 붙인다", () => {
    expect(displayName({ id: "u1", email: "dev.hyen@gmail.com" })).toBe(
      "my-dev.hyen",
    );
    expect(
      displayName({ id: "0b8f3c1e-2a4d-4e6f-8a1b-3c5d7e9f1a2b", email: null }),
    ).toBe("my-0b8f3c1e");
  });
});
