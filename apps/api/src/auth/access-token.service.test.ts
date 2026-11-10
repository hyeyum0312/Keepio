import { JwtService } from "@nestjs/jwt";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AccessTokenService,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "./access-token.service.js";

const SECRET = "s".repeat(32);
const USER_ID = "0b8f3c1e-2a4d-4e6f-8a1b-3c5d7e9f1a2b";

// AuthModule과 같은 설정
function serviceWith(secret = SECRET) {
  const jwt = new JwtService({
    secret,
    signOptions: {
      algorithm: JWT_ALGORITHM,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
    verifyOptions: {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  });
  return { service: new AccessTokenService(jwt), jwt };
}

describe("AccessTokenService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("AC-09: 발급한 토큰을 검증하면 사용자 ID를 돌려준다", async () => {
    const { service } = serviceWith();
    const token = await service.sign(USER_ID);

    await expect(service.verify(token)).resolves.toBe(USER_ID);
  });

  it("AC-07: 15분 뒤 만료된다", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { service } = serviceWith();
    const token = await service.sign(USER_ID);

    vi.advanceTimersByTime((ACCESS_TOKEN_TTL_SECONDS - 1) * 1000);
    await expect(service.verify(token)).resolves.toBe(USER_ID);
    vi.advanceTimersByTime(2000);
    await expect(service.verify(token)).resolves.toBeNull();
  });

  it("AC-09: 다른 키로 서명한 토큰은 거부한다", async () => {
    const forged = await serviceWith("x".repeat(32)).service.sign(USER_ID);

    await expect(serviceWith().service.verify(forged)).resolves.toBeNull();
  });

  it("AC-09: alg=none 토큰은 거부한다", async () => {
    const header = Buffer.from('{"alg":"none","typ":"JWT"}').toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({ sub: USER_ID, iss: JWT_ISSUER, aud: JWT_AUDIENCE }),
    ).toString("base64url");

    await expect(
      serviceWith().service.verify(`${header}.${payload}.`),
    ).resolves.toBeNull();
  });

  it.each([
    ["발급자가 다르면", { issuer: "someone-else" }],
    ["대상이 다르면", { audience: "other-app" }],
  ])("AC-09: %s 거부한다", async (_, override) => {
    const { service, jwt } = serviceWith();
    const token = await jwt.signAsync({ sub: USER_ID }, override);

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it("sub가 UUID가 아니면 거부한다", async () => {
    const { service, jwt } = serviceWith();
    const token = await jwt.signAsync({ sub: "1 OR 1=1" });

    await expect(service.verify(token)).resolves.toBeNull();
  });
});
