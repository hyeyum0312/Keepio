import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiException } from "../common/api-error.js";
import { AccessTokenService } from "./access-token.service.js";

export type AuthUser = { id: string };
export type AuthenticatedRequest = Request & { user: AuthUser };

const BEARER = /^Bearer ([^\s]+)$/i;

// 현재 사용자를 Access Token(JWT)으로 정한다(FEAT-003 AC-09). D-11의 개발용 헤더는 더 이상 받지 않는다(AC-18).
// DB를 조회하지 않는다. 컨트롤러는 @CurrentUser()로만 사용자를 받는다
@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly tokens: AccessTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = BEARER.exec(req.header("authorization") ?? "")?.[1];
    const userId = token ? await this.tokens.verify(token) : null;
    if (!userId) throw unauthenticated();
    req.user = { id: userId };
    return true;
  }
}

function unauthenticated() {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    "UNAUTHENTICATED",
    "로그인이 필요해요.",
  );
}
