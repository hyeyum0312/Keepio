import type { ExecutionContext } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import type { AccessTokenService } from "./access-token.service.js";
import { UserGuard } from "./user.guard.js";

const USER_ID = "0b8f3c1e-2a4d-4e6f-8a1b-3c5d7e9f1a2b";

function contextWith(headers: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const req = {
    header: (name: string) => lower[name.toLowerCase()],
  } as Record<string, unknown>;
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { context, req };
}

function guardVerifying(result: string | null) {
  const tokens = { verify: vi.fn().mockResolvedValue(result) };
  const guard = new UserGuard(tokens as unknown as AccessTokenService);
  return { guard, tokens };
}

describe("UserGuard (FEAT-003)", () => {
  it("AC-09: 유효한 Bearer 토큰이면 요청에 사용자를 싣는다", async () => {
    const { guard, tokens } = guardVerifying(USER_ID);
    const { context, req } = contextWith({ Authorization: "Bearer abc.def" });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokens.verify).toHaveBeenCalledWith("abc.def");
    expect(req.user).toEqual({ id: USER_ID });
  });

  it("AC-09: Bearer 스킴은 대소문자를 구분하지 않는다", async () => {
    const { guard } = guardVerifying(USER_ID);
    const { context } = contextWith({ authorization: "bearer abc.def" });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it.each([
    ["헤더가 없으면", {}],
    ["Bearer가 아니면", { authorization: "Basic dXNlcjpwYXNz" }],
    ["토큰이 비어 있으면", { authorization: "Bearer " }],
    ["AC-18: 개발용 사용자 ID 헤더만 있으면", { "x-dev-user-id": USER_ID }],
  ])("%s 검증하지 않고 401 UNAUTHENTICATED", async (_, headers) => {
    const { guard, tokens } = guardVerifying(USER_ID);
    const { context } = contextWith(headers);

    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiException);
    expect(error).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요해요.",
    });
    expect(tokens.verify).not.toHaveBeenCalled();
  });

  it("AC-09: 검증에 실패하면(서명·만료 등) 401 UNAUTHENTICATED", async () => {
    const { guard } = guardVerifying(null);
    const { context } = contextWith({ authorization: "Bearer forged" });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });
});
