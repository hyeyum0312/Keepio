import type { AuthRepository } from "./auth.repository.js";
import { MemoryMailSender } from "../mail/memory-mail.sender.js";
import { AuthService } from "./auth.service.js";
import { hashPassword, verifyDummyPassword } from "./lib/password.js";
import type { Session, SessionService } from "./session.service.js";

// 실제 함수는 그대로 쓰고, 더미 검증이 불렸는지만 확인할 수 있게 감싼다
vi.mock("./lib/password.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/password.js")>();
  return { ...actual, verifyDummyPassword: vi.fn(actual.verifyDummyPassword) };
});

const USER_ID = "0b8f3c1e-2a4d-4e6f-8a1b-3c5d7e9f1a2b";
const EMAIL = "user@example.com";
const PASSWORD = "correct horse battery";
const SESSION: Session = {
  accessToken: "access",
  expiresIn: 900,
  refreshToken: "refresh",
  refreshExpiresAt: new Date("2026-11-24T00:00:00Z"),
};
const INVALID_CREDENTIALS = {
  code: "INVALID_CREDENTIALS",
  message: "이메일 또는 비밀번호가 맞지 않아요.",
};

describe("AuthService.login", () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD);
  });

  beforeEach(() => {
    vi.mocked(verifyDummyPassword).mockClear();
  });

  // account: 이 이메일로 찾았을 때 저장소가 돌려줄 값(null = 없음)
  function serviceWith(account: { userId: string } | null) {
    const repo = {
      findPasswordLogin: vi
        .fn()
        .mockResolvedValue(account && { ...account, passwordHash }),
    };
    const sessions = { issue: vi.fn().mockResolvedValue(SESSION) };
    const service = new AuthService(
      repo as unknown as AuthRepository,
      sessions as unknown as SessionService,
      new MemoryMailSender(),
    );
    return { service, repo, sessions };
  }

  it("AC-07: 이메일과 비밀번호가 맞으면 그 사용자의 세션을 발급한다", async () => {
    const { service, sessions } = serviceWith({ userId: USER_ID });

    await expect(service.login(EMAIL, PASSWORD)).resolves.toBe(SESSION);
    expect(sessions.issue).toHaveBeenCalledWith(USER_ID);
  });

  it("AC-02: 이메일은 정규화해서 찾는다", async () => {
    const { service, repo } = serviceWith({ userId: USER_ID });

    await service.login("  User@Example.COM ", PASSWORD);

    expect(repo.findPasswordLogin).toHaveBeenCalledWith(EMAIL);
  });

  it("AC-08: 비밀번호가 틀리면 401 INVALID_CREDENTIALS이고 세션을 만들지 않는다", async () => {
    const { service, sessions } = serviceWith({ userId: USER_ID });

    await expect(service.login(EMAIL, "wrong password")).rejects.toMatchObject(
      INVALID_CREDENTIALS,
    );
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it("AC-08: 없는 이메일도 같은 오류이고, 응답 시간을 맞추려고 더미 검증을 한다", async () => {
    const { service, sessions } = serviceWith(null);

    await expect(service.login(EMAIL, PASSWORD)).rejects.toMatchObject(
      INVALID_CREDENTIALS,
    );
    expect(verifyDummyPassword).toHaveBeenCalledWith(PASSWORD);
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it("AC-08: 이메일 형식이 아니면 DB를 찾지 않지만 같은 오류와 더미 검증", async () => {
    const { service, repo } = serviceWith({ userId: USER_ID });

    await expect(service.login("not-an-email", PASSWORD)).rejects.toMatchObject(
      INVALID_CREDENTIALS,
    );
    expect(repo.findPasswordLogin).not.toHaveBeenCalled();
    expect(verifyDummyPassword).toHaveBeenCalledWith(PASSWORD);
  });

  it("AC-08: 비밀번호가 맞으면 더미 검증은 하지 않는다", async () => {
    const { service } = serviceWith({ userId: USER_ID });

    await service.login(EMAIL, PASSWORD);

    expect(verifyDummyPassword).not.toHaveBeenCalled();
  });
});
