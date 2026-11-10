import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import * as oidc from "openid-client";
import { ApiException } from "../common/api-error.js";
import { maskEmail } from "../common/mask-email.js";
import {
  loadEnv,
  OAUTH_PROVIDERS,
  type OAuthProviderName,
} from "../config/env.js";
import { AuthRepository } from "./auth.repository.js";
import { normalizeEmail } from "./lib/email.js";
import {
  flowCookieKey,
  OAUTH_FLOW_TTL_MS,
  openFlow,
  sealFlow,
} from "./lib/oauth-flow-cookie.js";
import { OAuthGateway } from "./oauth.gateway.js";
import { type Session, SessionService } from "./session.service.js";

export type OAuthCallbackResult =
  | { outcome: "success"; session: Session }
  | { outcome: "cancelled" }
  | { outcome: "failed" };

const logger = new Logger("OAuth");

// 소셜 로그인(FEAT-004). 제공자 통신은 OAuthGateway, 계정 결정은 저장소, 세션은 SessionService
@Injectable()
export class OAuthService {
  private flowKey?: Buffer;
  private apiOrigin?: string;

  constructor(
    private readonly gateway: OAuthGateway,
    private readonly repo: AuthRepository,
    private readonly sessions: SessionService,
  ) {}

  // AC-05
  providers(): OAuthProviderName[] {
    return this.gateway.enabledProviders();
  }

  // AC-01. 돌려준 cookie 값은 서명된 HttpOnly 쿠키로 브라우저에 맡긴다
  async start(providerParam: string): Promise<{ url: string; cookie: string }> {
    const provider = this.enabled(providerParam);
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const url = await this.gateway.authorizationUrl(provider, {
      redirectUri: this.redirectUri(provider),
      state,
      nonce,
      codeChallenge: await oidc.calculatePKCECodeChallenge(codeVerifier),
    });
    const cookie = sealFlow(
      {
        provider,
        state,
        nonce,
        codeVerifier,
        expiresAt: Date.now() + OAUTH_FLOW_TTL_MS,
      },
      this.key(),
    );
    return { url: url.href, cookie };
  }

  // AC-02~04·AC-06~10. 실패 이유는 응답으로 구분하지 않고 로그로만 남긴다(ADR-012)
  async callback(
    providerParam: string,
    query: Record<string, unknown>,
    flowCookie: string | undefined,
  ): Promise<OAuthCallbackResult> {
    const provider = this.enabled(providerParam);
    if (query.error === "access_denied") return { outcome: "cancelled" };

    const flow = openFlow(flowCookie, this.key(), provider, Date.now());
    if (!flow)
      return this.fail(provider, "missing, expired or tampered flow cookie");
    if (typeof query.state !== "string" || query.state !== flow.state) {
      return this.fail(provider, "state mismatch");
    }
    if (typeof query.error === "string") {
      return this.fail(provider, `provider error ${query.error.slice(0, 64)}`);
    }

    let identity;
    try {
      identity = await this.gateway.exchange(provider, {
        callbackUrl: this.callbackUrl(provider, query),
        state: flow.state,
        nonce: flow.nonce,
        codeVerifier: flow.codeVerifier,
      });
    } catch (error) {
      return this.fail(
        provider,
        `code exchange failed: ${error instanceof Error ? error.name : "unknown"}`,
      );
    }

    // DB CHECK(소문자·trim)를 지키고, 이상한 값은 이메일 없음으로 본다
    const normalized = identity.email ? normalizeEmail(identity.email) : null;
    const userId = await this.repo.resolveOAuthUser(
      provider,
      {
        ...identity,
        email: normalized?.ok ? normalized.email : null,
      },
      new Date(),
    );
    logger.log(
      `oauth login provider=${provider} email=${normalized?.ok ? maskEmail(normalized.email) : "none"}`,
    );
    return { outcome: "success", session: await this.sessions.issue(userId) };
  }

  private enabled(providerParam: string): OAuthProviderName {
    const provider = OAUTH_PROVIDERS.find((p) => p === providerParam);
    if (!provider || !this.gateway.enabledProviders().includes(provider)) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        "NOT_FOUND",
        "요청한 주소를 찾을 수 없어요.",
      );
    }
    return provider;
  }

  private fail(provider: OAuthProviderName, reason: string) {
    logger.warn(`oauth callback failed provider=${provider} reason=${reason}`);
    return { outcome: "failed" } as const;
  }

  // 프록시 뒤에서도 제공자에 등록한 주소와 같도록 요청 Host가 아니라 API_ORIGIN으로 만든다
  private redirectUri(provider: OAuthProviderName) {
    this.apiOrigin ??= loadEnv().apiOrigin;
    if (!this.apiOrigin) throw new Error("API_ORIGIN is not configured");
    return `${this.apiOrigin}/api/auth/oauth/${provider}/callback`;
  }

  private callbackUrl(
    provider: OAuthProviderName,
    query: Record<string, unknown>,
  ): URL {
    const url = new URL(this.redirectUri(provider));
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") url.searchParams.set(key, value);
    }
    return url;
  }

  private key() {
    this.flowKey ??= flowCookieKey(loadEnv().jwtSecret);
    return this.flowKey;
  }
}
