import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { ApiErrorResponse } from "../common/api-error.js";
import {
  AuthThrottlerGuard,
  THROTTLE_IP,
  THROTTLE_LOGIN_EMAIL,
  THROTTLE_MAIL_EMAIL,
} from "./auth-throttler.guard.js";
import { AuthService } from "./auth.service.js";
import { AccessTokenResponse } from "./dto/auth-response.dto.js";
import { CredentialsDto } from "./dto/credentials-auth.dto.js";
import { EmailDto } from "./dto/email-auth.dto.js";
import { ResetPasswordDto } from "./dto/reset-password-auth.dto.js";
import { TokenDto } from "./dto/token-auth.dto.js";
import {
  assertTrustedOrigin,
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from "./refresh-cookie.js";
import { type Session, SessionService } from "./session.service.js";

// FEAT-003. 요청 제한은 AuthThrottlerGuard(IP·로그인 이메일·메일 이메일). 라우트마다 해당 없는 제한을 끈다
@Controller("api/auth")
@UseGuards(AuthThrottlerGuard)
@ApiTooManyRequestsResponse({ type: ApiErrorResponse })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post("signup")
  @HttpCode(HttpStatus.ACCEPTED)
  @SkipThrottle({ [THROTTLE_LOGIN_EMAIL]: true })
  @ApiAcceptedResponse({ description: "가입 여부와 무관하게 같은 응답" })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  signup(@Body() dto: CredentialsDto): Promise<void> {
    return this.auth.signup(dto.email, dto.password);
  }

  @Post("email-verification")
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle({ [THROTTLE_LOGIN_EMAIL]: true, [THROTTLE_MAIL_EMAIL]: true })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  verifyEmail(@Body() dto: TokenDto): Promise<void> {
    return this.auth.verifyEmail(dto.token);
  }

  @Post("email-verification/resend")
  @HttpCode(HttpStatus.ACCEPTED)
  @SkipThrottle({ [THROTTLE_LOGIN_EMAIL]: true })
  @ApiAcceptedResponse({ description: "가입·인증 여부와 무관하게 같은 응답" })
  resendVerification(@Body() dto: EmailDto): Promise<void> {
    return this.auth.resendVerification(dto.email);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @SkipThrottle({ [THROTTLE_MAIL_EMAIL]: true })
  @ApiOkResponse({
    type: AccessTokenResponse,
    description: "Refresh Token은 HttpOnly 쿠키로 준다",
  })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  async login(
    @Body() dto: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponse> {
    const session = await this.auth.login(dto.email, dto.password);
    return respondWithSession(res, session);
  }

  // Refresh Token은 무작위 256비트라 추측 공격이 없어 요청 제한을 두지 않는다(여러 탭의 정상 갱신을 막지 않도록)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @SkipAllThrottles()
  @ApiOkResponse({ type: AccessTokenResponse })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  @ApiForbiddenResponse({ type: ApiErrorResponse })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponse> {
    assertTrustedOrigin(req);
    try {
      const session = await this.sessions.rotate(readRefreshCookie(req));
      return respondWithSession(res, session);
    } catch (error) {
      // 쓸 수 없는 쿠키는 지워서 다음 요청부터 보내지 않게 한다
      clearRefreshCookie(res);
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipAllThrottles()
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ApiErrorResponse })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    assertTrustedOrigin(req);
    await this.sessions.revoke(readRefreshCookie(req));
    clearRefreshCookie(res);
  }

  @Post("password-reset")
  @HttpCode(HttpStatus.ACCEPTED)
  @SkipThrottle({ [THROTTLE_LOGIN_EMAIL]: true })
  @ApiAcceptedResponse({ description: "가입 여부와 무관하게 같은 응답" })
  requestPasswordReset(@Body() dto: EmailDto): Promise<void> {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Post("password-reset/confirm")
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle({ [THROTTLE_LOGIN_EMAIL]: true, [THROTTLE_MAIL_EMAIL]: true })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  confirmPasswordReset(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.auth.confirmPasswordReset(dto.token, dto.newPassword);
  }
}

function SkipAllThrottles() {
  return SkipThrottle({
    [THROTTLE_IP]: true,
    [THROTTLE_LOGIN_EMAIL]: true,
    [THROTTLE_MAIL_EMAIL]: true,
  });
}

function respondWithSession(
  res: Response,
  session: Session,
): AccessTokenResponse {
  setRefreshCookie(res, session);
  return { accessToken: session.accessToken, expiresIn: session.expiresIn };
}
