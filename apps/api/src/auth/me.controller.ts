import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiErrorResponse } from "../common/api-error.js";
import { AuthService } from "./auth.service.js";
import { CurrentUser } from "./current-user.decorator.js";
import { MeResponse } from "./dto/auth-response.dto.js";
import { type AuthUser, UserGuard } from "./user.guard.js";

@Controller("api/me")
@UseGuards(UserGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorResponse })
export class MeController {
  constructor(private readonly auth: AuthService) {}

  // FEAT-003 AC-06: 이메일 인증 여부는 서버가 준다(프론트가 판단하지 않는다)
  @Get()
  @ApiOkResponse({ type: MeResponse })
  me(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.auth.me(user.id);
  }
}
