import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest, AuthUser } from "./user.guard.js";

// UserGuard가 정한 사용자. 사용자 ID를 body·query에서 받지 않는다(BACKEND.md)
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
