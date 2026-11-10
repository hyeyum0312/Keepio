import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { ApiErrorResponse } from "../common/api-error.js";
import {
  AuthThrottlerGuard,
  THROTTLE_LOGIN_EMAIL,
  THROTTLE_MAIL_EMAIL,
} from "./auth-throttler.guard.js";
import { OAuthProvidersResponse } from "./dto/auth-response.dto.js";
import { OAUTH_FLOW_TTL_MS } from "./lib/oauth-flow-cookie.js";
import { OAuthService } from "./oauth.service.js";
import { setRefreshCookie } from "./refresh-cookie.js";
import { webOrigin } from "./web-origin.js";

// 시작~콜백 사이에만 필요한 쿠키. 콜백 경로에만 실린다
const FLOW_COOKIE = "keepio_oauth";
const FLOW_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  // 제공자에서 돌아오는 최상위 GET 이동에는 Lax 쿠키가 실린다
  sameSite: "lax",
  path: "/api/auth/oauth",
} as const;

// FEAT-004. start·callback은 브라우저 이동(302)이라 JSON 오류 대신 웹 주소로 보낸다(ADR-012)
@Controller("api/auth/oauth")
@UseGuards(AuthThrottlerGuard)
@SkipThrottle({ [THROTTLE_LOGIN_EMAIL]: true, [THROTTLE_MAIL_EMAIL]: true })
@ApiTooManyRequestsResponse({ type: ApiErrorResponse })
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  @Get("providers")
  @ApiOkResponse({ type: OAuthProvidersResponse })
  providers(): OAuthProvidersResponse {
    return { providers: this.oauth.providers() };
  }

  @Get(":provider/start")
  @ApiFoundResponse({ description: "제공자 동의 화면으로 이동" })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  async start(
    @Param("provider") provider: string,
    @Res() res: Response,
  ): Promise<void> {
    const { url, cookie } = await this.oauth.start(provider);
    res.cookie(FLOW_COOKIE, cookie, {
      ...FLOW_COOKIE_OPTIONS,
      maxAge: OAUTH_FLOW_TTL_MS,
    });
    res.redirect(HttpStatus.FOUND, url);
  }

  @Get(":provider/callback")
  @ApiFoundResponse({
    description:
      "성공 /auth/callback, 취소 /login, 실패 /login?oauth=failed (웹 주소)",
  })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  async callback(
    @Param("provider") provider: string,
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const flowCookie: unknown = req.cookies?.[FLOW_COOKIE];
    const result = await this.oauth.callback(
      provider,
      query,
      typeof flowCookie === "string" ? flowCookie : undefined,
    );
    // 한 번 쓴 흐름 쿠키는 결과와 무관하게 지운다(재사용 방지)
    res.clearCookie(FLOW_COOKIE, FLOW_COOKIE_OPTIONS);
    if (result.outcome === "success") {
      setRefreshCookie(res, result.session);
      res.redirect(HttpStatus.FOUND, `${webOrigin()}/auth/callback`);
      return;
    }
    res.redirect(
      HttpStatus.FOUND,
      result.outcome === "cancelled"
        ? `${webOrigin()}/login`
        : `${webOrigin()}/login?oauth=failed`,
    );
  }
}
