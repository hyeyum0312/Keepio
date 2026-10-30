import type { ExecutionContext } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import type { AuthRepository } from "./auth.repository.js";
import { DEV_USER_HEADER, UserGuard } from "./user.guard.js";

const USER_ID = "0b8f3c1e-2a4d-4e6f-8a1b-3c5d7e9f1a2b";
const BASE_ENV = { DATABASE_URL: "postgresql://u:p@localhost:5432/db" };

function contextWith(headers: Record<string, string>) {
  const req = {
    header: (name: string) => headers[name],
  } as Record<string, unknown>;
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { context, req };
}

function guardIn(nodeEnv: string, userExists = true) {
  const repo = { userExists: vi.fn().mockResolvedValue(userExists) };
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("DATABASE_URL", BASE_ENV.DATABASE_URL);
  const guard = new UserGuard(repo as unknown as AuthRepository);
  return { guard, repo };
}

describe("UserGuard (D-11 개발·테스트 전용)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("운영 환경에서는 헤더가 있어도 DB를 조회하지 않고 거부한다", async () => {
    const { guard, repo } = guardIn("production");
    const { context } = contextWith({ [DEV_USER_HEADER]: USER_ID });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(repo.userExists).not.toHaveBeenCalled();
  });

  it("개발 환경에서 존재하는 사용자 ID면 요청에 사용자를 싣는다", async () => {
    const { guard } = guardIn("development");
    const { context, req } = contextWith({ [DEV_USER_HEADER]: USER_ID });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toEqual({ id: USER_ID });
  });

  it.each([
    ["헤더가 없으면", {}, true],
    ["UUID 형식이 아니면", { [DEV_USER_HEADER]: "1 OR 1=1" }, true],
    ["없는 사용자면", { [DEV_USER_HEADER]: USER_ID }, false],
  ])("%s 401 UNAUTHENTICATED로 거부한다", async (_, headers, exists) => {
    const { guard } = guardIn("test", exists);
    const { context } = contextWith(headers);

    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiException);
    expect(error).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요해요.",
    });
  });
});
