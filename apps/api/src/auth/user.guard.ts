import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiException } from "../common/api-error.js";
import { type Env, loadEnv } from "../config/env.js";
import { AuthRepository } from "./auth.repository.js";

export const DEV_USER_HEADER = "x-dev-user-id";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AuthUser = { id: string };
export type AuthenticatedRequest = Request & { user: AuthUser };

// 현재 사용자를 정한다. 인증(D-04) 전까지는 개발·테스트 전용으로 헤더의 사용자 ID를 믿고(D-11),
// 운영에서는 항상 거부한다(fail-closed). 인증 기능이 이 클래스 내부만 교체한다
@Injectable()
export class UserGuard implements CanActivate {
  private nodeEnv?: Env["nodeEnv"];

  constructor(private readonly auth: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 시작 시 검증은 main.ts가 한다. 생성자에서 읽으면 DB 설정 없이 모듈을 띄우는 단위 테스트까지 막힌다
    this.nodeEnv ??= loadEnv().nodeEnv;
    if (this.nodeEnv === "production") throw unauthenticated();

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const id = req.header(DEV_USER_HEADER);
    if (!id || !UUID.test(id) || !(await this.auth.userExists(id))) {
      throw unauthenticated();
    }
    req.user = { id };
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
