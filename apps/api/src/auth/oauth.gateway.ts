import * as oidc from "openid-client";
import type { OAuthCredentials, OAuthProviderName } from "../config/env.js";

// 제공자에서 받은 사용자 정보 중 로그인에 쓰는 것만(FEAT-004: 이름·사진·토큰은 쓰지 않는다)
export type OAuthIdentity = {
  subject: string;
  email: string | null;
  emailVerified: boolean;
};

export type AuthorizationRequest = {
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
};

export type CodeExchange = {
  // 제공자가 돌려보낸 콜백 주소 전체(code·state 포함). 기준 주소는 API_ORIGIN으로 만든다
  callbackUrl: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
};

// 제공자와의 통신을 바꿔 끼우기 위한 DI 토큰(운영 openid-client, 테스트 가짜)
export abstract class OAuthGateway {
  abstract enabledProviders(): OAuthProviderName[];
  abstract authorizationUrl(
    provider: OAuthProviderName,
    request: AuthorizationRequest,
  ): Promise<URL>;
  // state·nonce·PKCE·ID 토큰 서명·iss·aud·exp 검증까지 통과해야 값을 준다. 실패는 예외
  abstract exchange(
    provider: OAuthProviderName,
    exchange: CodeExchange,
  ): Promise<OAuthIdentity>;
}

const PROVIDERS: Record<OAuthProviderName, { issuer: string; scope: string }> =
  {
    google: { issuer: "https://accounts.google.com", scope: "openid email" },
    // Kakao는 이메일 동의 항목이 account_email. 이메일 인증 여부 클레임은 실제 키로 확인 필요(FEAT-004 가정)
    kakao: { issuer: "https://kauth.kakao.com", scope: "openid account_email" },
  };

// 외부 호출 상한(초). 기본 30초는 요청 스레드를 오래 잡는다
const REQUEST_TIMEOUT_SECONDS = 5;

export class OpenIdOAuthGateway extends OAuthGateway {
  // discovery 문서는 프로세스당 한 번(실패하면 다음 요청에서 다시 시도)
  private readonly configs = new Map<
    OAuthProviderName,
    Promise<oidc.Configuration>
  >();

  constructor(
    private readonly credentials: Partial<
      Record<OAuthProviderName, OAuthCredentials>
    >,
  ) {
    super();
  }

  enabledProviders(): OAuthProviderName[] {
    return (Object.keys(PROVIDERS) as OAuthProviderName[]).filter(
      (p) => this.credentials[p],
    );
  }

  async authorizationUrl(
    provider: OAuthProviderName,
    request: AuthorizationRequest,
  ): Promise<URL> {
    return oidc.buildAuthorizationUrl(await this.config(provider), {
      redirect_uri: request.redirectUri,
      scope: PROVIDERS[provider].scope,
      state: request.state,
      nonce: request.nonce,
      code_challenge: request.codeChallenge,
      code_challenge_method: "S256",
    });
  }

  async exchange(
    provider: OAuthProviderName,
    exchange: CodeExchange,
  ): Promise<OAuthIdentity> {
    const tokens = await oidc.authorizationCodeGrant(
      await this.config(provider),
      exchange.callbackUrl,
      {
        pkceCodeVerifier: exchange.codeVerifier,
        expectedState: exchange.state,
        expectedNonce: exchange.nonce,
        idTokenExpected: true,
      },
    );
    const claims = tokens.claims();
    if (!claims?.sub) throw new Error("id_token without sub");
    return {
      subject: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      // 명시적으로 true일 때만 인증된 이메일로 본다(없으면 자동 연결하지 않는다)
      emailVerified: claims.email_verified === true,
    };
  }

  private config(provider: OAuthProviderName): Promise<oidc.Configuration> {
    let config = this.configs.get(provider);
    if (!config) {
      const credentials = this.credentials[provider];
      if (!credentials) throw new Error(`oauth provider disabled: ${provider}`);
      config = oidc
        .discovery(
          new URL(PROVIDERS[provider].issuer),
          credentials.clientId,
          undefined,
          oidc.ClientSecretPost(credentials.clientSecret),
          { timeout: REQUEST_TIMEOUT_SECONDS },
        )
        .catch((error: unknown) => {
          this.configs.delete(provider);
          throw error;
        });
      this.configs.set(provider, config);
    }
    return config;
  }
}
