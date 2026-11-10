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
import { AccountPanel } from "./AccountPanel";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { RequireAuth } from "./RequireAuth";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SignupForm } from "./SignupForm";
import { VerifyEmail } from "./VerifyEmail";

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
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
      const route = routes[path];
      if (!route) throw new Error(`unexpected request ${path}`);
      return route(init);
    }),
  );
  return {
    requests,
    count: (path: string) => requests.filter((r) => r.path === path).length,
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
    replace.mockClear();
    searchParams = new URLSearchParams();
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("로그인", () => {
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
      expect(api.requests[0].body).toEqual({
        email: "user@example.com",
        password: "correct horse",
      });
      expect(window.localStorage.length).toBe(0);
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
    it("AC-07: 가입이 접수되면 인증 메일 안내를 보여 준다", async () => {
      stubApi({ "/api/auth/signup": () => json(202) });
      renderWithClient(<SignupForm />);

      await userEvent.type(screen.getByLabelText("이메일"), "user@example.com");
      await userEvent.type(screen.getByLabelText(/비밀번호/), "correct horse");
      await userEvent.click(screen.getByRole("button", { name: "가입하기" }));

      expect(await screen.findByRole("status")).toHaveTextContent(
        "인증 메일을 보냈어요",
      );
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
      await userEvent.type(screen.getByLabelText(/비밀번호/), "short");
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
        await screen.findByText("이메일 인증이 끝났어요."),
      ).toBeInTheDocument();
      expect(window.location.search).toBe("");
      expect(api.count("/api/auth/email-verification")).toBe(1);
      expect(api.requests[0].body).toEqual({ token: TOKEN });
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
      expect(api.requests[0].body).toEqual({
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

    it("AC-05·AC-12: 비로그인이 되면 /login으로 보낸다", () => {
      renderWithClient(
        <RequireAuth>
          <p>비밀 내용</p>
        </RequireAuth>,
      );

      act(() => clearSession());

      expect(replace).toHaveBeenCalledWith("/login");
      expect(screen.queryByText("비밀 내용")).not.toBeInTheDocument();
    });

    it("AC-12: 로그인 상태면 내 이메일과 인증 여부를 보여 주고, 로그아웃하면 비로그인이 된다", async () => {
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
        <RequireAuth>
          <AccountPanel />
        </RequireAuth>,
      );

      expect(await screen.findByText("user@example.com")).toBeInTheDocument();
      expect(screen.getByText("인증 전이에요")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));

      await vi.waitFor(() => expect(getAuthStatus()).toBe("anonymous"));
      expect(getAccessToken()).toBeNull();
      expect(api.count("/api/auth/logout")).toBe(1);
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });
});
