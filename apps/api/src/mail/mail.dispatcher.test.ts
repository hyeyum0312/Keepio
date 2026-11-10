import {
  MAX_CONCURRENT_SENDS,
  MAX_QUEUED_MAILS,
  MailDispatcher,
  SHUTDOWN_DRAIN_TIMEOUT_MS,
} from "./mail.dispatcher.js";
import { type MailMessage, MailSender } from "./mail.sender.js";

function message(i: number): MailMessage {
  return { to: `user${i}@example.com`, subject: "s", text: "t" };
}

// 직접 끝낼 때까지 발송이 멈춰 있는 sender
class ControlledSender extends MailSender {
  readonly started: MailMessage[] = [];
  private readonly finishers: ((error?: Error) => void)[] = [];

  send(m: MailMessage): Promise<void> {
    this.started.push(m);
    return new Promise((resolve, reject) =>
      this.finishers.push((error) => (error ? reject(error) : resolve())),
    );
  }

  finishNext(error?: Error) {
    this.finishers.shift()?.(error);
  }

  finishAll() {
    while (this.finishers.length > 0) this.finishNext();
  }
}

describe("MailDispatcher", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("enqueue는 발송을 기다리지 않고 바로 돌아온다", () => {
    const sender = new ControlledSender();
    const dispatcher = new MailDispatcher(sender);

    const result = dispatcher.enqueue(message(1));

    expect(result).toBeUndefined();
    expect(sender.started).toHaveLength(1);
  });

  it("동시에 보내는 메일은 상한까지만, 끝나면 다음 것을 보낸다", async () => {
    const sender = new ControlledSender();
    const dispatcher = new MailDispatcher(sender);

    for (let i = 0; i < MAX_CONCURRENT_SENDS + 2; i++) {
      dispatcher.enqueue(message(i));
    }
    expect(sender.started).toHaveLength(MAX_CONCURRENT_SENDS);

    sender.finishNext();
    await vi.waitFor(() =>
      expect(sender.started).toHaveLength(MAX_CONCURRENT_SENDS + 1),
    );
  });

  it("발송이 실패해도 예외를 던지지 않고 다음 메일을 계속 보낸다", async () => {
    const sender = new ControlledSender();
    const dispatcher = new MailDispatcher(sender);
    dispatcher.enqueue(message(1));
    dispatcher.enqueue(message(2));

    sender.finishNext(new Error("smtp down"));
    sender.finishNext();

    await expect(dispatcher.drain()).resolves.toBeUndefined();
    expect(sender.started).toHaveLength(2);
  });

  it("대기열이 가득 차면 새 메일은 버린다(메모리 상한)", async () => {
    // 문을 열기 전까지 모든 발송이 멈춰 있다
    let open!: () => void;
    const gate = new Promise<void>((resolve) => (open = resolve));
    const sent: MailMessage[] = [];
    const sender = new (class extends MailSender {
      async send(m: MailMessage) {
        await gate;
        sent.push(m);
      }
    })();
    const dispatcher = new MailDispatcher(sender);
    const total = MAX_CONCURRENT_SENDS + MAX_QUEUED_MAILS + 1;

    for (let i = 0; i < total; i++) dispatcher.enqueue(message(i));
    open();
    await dispatcher.drain();

    expect(sent).toHaveLength(total - 1);
    expect(sent.map((m) => m.to)).not.toContain(message(total - 1).to);
  });

  it("drain은 대기·발송 중인 메일이 모두 끝나야 이행한다", async () => {
    const sender = new ControlledSender();
    const dispatcher = new MailDispatcher(sender);
    dispatcher.enqueue(message(1));
    let drained = false;
    const done = dispatcher.drain().then(() => (drained = true));

    await Promise.resolve();
    expect(drained).toBe(false);
    sender.finishAll();
    await done;
    expect(drained).toBe(true);
  });

  it("종료 시 남은 메일을 기다리되 상한 시간이 지나면 멈추지 않고 끝낸다", async () => {
    vi.useFakeTimers();
    const sender = new ControlledSender();
    const dispatcher = new MailDispatcher(sender);
    dispatcher.enqueue(message(1));

    const shutdown = dispatcher.onApplicationShutdown();
    await vi.advanceTimersByTimeAsync(SHUTDOWN_DRAIN_TIMEOUT_MS);

    await expect(shutdown).resolves.toBeUndefined();
  });
});
