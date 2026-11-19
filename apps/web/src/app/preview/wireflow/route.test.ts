import { GET } from "./route";

describe("기획 와이어플로우 미리보기", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("배포(production)에서는 404", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await GET()).status).toBe(404);
  });

  it("개발 환경에서는 와이어플로우 HTML을 준다", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("Keepio 웹 MVP 와이어플로우");
  });
});
