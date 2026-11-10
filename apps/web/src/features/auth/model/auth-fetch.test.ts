import { authFetch } from "./auth-fetch";
import {
  getAccessToken,
  getAuthStatus,
  resetSessionForTest,
  setSession,
} from "./session-store";

const PROTECTED = "http://api.test/api/bookmarks";

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const UNAUTHENTICATED = {
  code: "UNAUTHENTICATED",
  message: "로그인이 필요해요.",
};

// fetch를 대체하고 호출을 기록한다. refresh는 api-client(apiFetch)를 거쳐 같은 fetch로 온다
function stubFetch(handler: Handler) {
  const calls: { url: string; auth: string | null }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = String(input);
      calls.push({ url, auth: new Headers(init.headers).get("Authorization") });
      return handler(url, init);
    }),
  );
  return {
    calls,
    refreshCount: () =>
      calls.filter((c) => c.url.endsWith("/api/auth/refresh")).length,
  };
}

// 새 토큰이 있어야 통과하는 보호 API + refresh(성공 시 "new")
function server(refresh: () => Response | Promise<Response>): Handler {
  return (url, init) => {
    if (url.endsWith("/api/auth/refresh")) return refresh();
    const ok = new Headers(init.headers).get("Authorization") === "Bearer new";
    return ok ? json(200, { ok: true }) : json(401, UNAUTHENTICATED);
  };
}

describe("authFetch (FEAT-006)", () => {
  beforeEach(() => {
    resetSessionForTest();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("AC-02: 토큰이 있으면 Authorization을 붙이고, 없으면 붙이지 않는다", async () => {
    const { calls } = stubFetch(() => json(200, {}));

    await authFetch(PROTECTED);
    setSession("abc");
    await authFetch(PROTECTED, { headers: { "x-other": "1" } });

    expect(calls[0].auth).toBeNull();
    expect(calls[1].auth).toBe("Bearer abc");
  });

  it("AC-03: 401 UNAUTHENTICATED면 refresh 1번 후 새 토큰으로 원래 요청을 1번 다시 보낸다", async () => {
    setSession("expired");
    const fetchStub = stubFetch(
      server(() => json(200, { accessToken: "new", expiresIn: 900 })),
    );

    const res = await authFetch(PROTECTED, { method: "POST", body: "{}" });

    expect(res.status).toBe(200);
    expect(fetchStub.refreshCount()).toBe(1);
    expect(fetchStub.calls.map((c) => c.auth)).toEqual([
      "Bearer expired",
      null,
      "Bearer new",
    ]);
    expect(getAccessToken()).toBe("new");
  });

  it("AC-03: 재시도도 401이면 더 반복하지 않는다", async () => {
    setSession("expired");
    const fetchStub = stubFetch((url) =>
      url.endsWith("/api/auth/refresh")
        ? json(200, { accessToken: "still-bad", expiresIn: 900 })
        : json(401, UNAUTHENTICATED),
    );

    const res = await authFetch(PROTECTED);

    expect(res.status).toBe(401);
    expect(fetchStub.calls).toHaveLength(3);
    expect(fetchStub.refreshCount()).toBe(1);
  });

  it.each([
    ["인증 API 자체의 401", "http://api.test/api/auth/login", UNAUTHENTICATED],
    [
      "UNAUTHENTICATED가 아닌 401",
      PROTECTED,
      { code: "SESSION_EXPIRED", message: "x" },
    ],
  ])("AC-03: %s에는 refresh하지 않는다", async (_, url, body) => {
    setSession("t");
    const fetchStub = stubFetch(() => json(401, body));

    const res = await authFetch(url);

    expect(res.status).toBe(401);
    expect(fetchStub.refreshCount()).toBe(0);
  });

  it("AC-04: 동시에 5개가 401이어도 refresh는 1번이고 모두 새 토큰으로 성공한다", async () => {
    setSession("expired");
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const fetchStub = stubFetch(
      server(async () => {
        await gate;
        return json(200, { accessToken: "new", expiresIn: 900 });
      }),
    );

    const pending = Array.from({ length: 5 }, () => authFetch(PROTECTED));
    await vi.waitFor(() => expect(fetchStub.refreshCount()).toBe(1));
    release();
    const results = await Promise.all(pending);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(fetchStub.refreshCount()).toBe(1);
  });

  it("AC-05: refresh가 실패하면 토큰을 비우고 비로그인이 되며 원래 401을 돌려준다", async () => {
    setSession("expired");
    stubFetch(
      server(() =>
        json(401, {
          code: "SESSION_EXPIRED",
          message: "다시 로그인해 주세요.",
        }),
      ),
    );

    const res = await authFetch(PROTECTED);

    expect(res.status).toBe(401);
    expect(getAccessToken()).toBeNull();
    expect(getAuthStatus()).toBe("anonymous");
  });

  it("AC-05: refresh 요청 자체가 실패해도(네트워크) 비로그인이 된다", async () => {
    setSession("expired");
    stubFetch(
      server(() => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const res = await authFetch(PROTECTED);

    expect(res.status).toBe(401);
    expect(getAuthStatus()).toBe("anonymous");
  });
});
