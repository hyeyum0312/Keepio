import { ConsoleMailSender } from "./console-mail.sender.js";
import { createMailSender } from "./mail.module.js";
import { MemoryMailSender } from "./memory-mail.sender.js";
import { ResendMailSender, SEND_TIMEOUT_MS } from "./resend-mail.sender.js";

const MESSAGE = {
  to: "user@example.com",
  subject: "인증",
  text: "https://keepio.example/verify?token=secret-token",
};

describe("createMailSender", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/db");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("운영은 Resend로 보낸다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WEB_ORIGIN", "https://keepio.example");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "no-reply@keepio.example");
    expect(createMailSender()).toBeInstanceOf(ResendMailSender);
  });

  it("개발은 실제로 보내지 않고 콘솔에 출력한다", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(createMailSender()).toBeInstanceOf(ConsoleMailSender);
  });

  it("테스트는 메모리에 기록한다", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(createMailSender()).toBeInstanceOf(MemoryMailSender);
  });
});

describe("ResendMailSender", () => {
  function senderWith(result: { error: { name: string } | null }) {
    const send = vi.fn().mockResolvedValue({ data: null, ...result });
    const sender = new ResendMailSender(
      { emails: { send } } as never,
      "keepio <no-reply@keepio.example>",
    );
    return { sender, send };
  }

  it("발신 주소와 취소 신호를 함께 넘긴다", async () => {
    const { sender, send } = senderWith({ error: null });
    await sender.send(MESSAGE);

    expect(send).toHaveBeenCalledWith(
      { from: "keepio <no-reply@keepio.example>", ...MESSAGE },
      { signal: expect.any(AbortSignal) },
    );
    expect(SEND_TIMEOUT_MS).toBe(5_000);
  });

  it("실패하면 예외를 던지고 메시지에 주소·본문을 넣지 않는다", async () => {
    const { sender } = senderWith({ error: { name: "rate_limit_exceeded" } });
    const error = await sender.send(MESSAGE).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("rate_limit_exceeded");
    expect((error as Error).message).not.toMatch(/user@example|secret-token/);
  });
});
