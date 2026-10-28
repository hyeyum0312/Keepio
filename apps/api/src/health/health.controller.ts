import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiProperty,
  ApiServiceUnavailableResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { PrismaService } from "../prisma/prisma.service.js";

const DB_CHECK_TIMEOUT_MS = 2_000;

export class HealthResponse {
  @ApiProperty({ enum: ["ok", "error"] })
  status!: "ok" | "error";

  @ApiProperty({ enum: ["up", "down"] })
  db!: "up" | "down";
}

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponse })
  @ApiServiceUnavailableResponse({ type: HealthResponse })
  // DB down은 오류가 아니라 점검 결과라 예외 대신 503 상태로 같은 형태를 돌려준다
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthResponse> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("DB check timed out")),
        DB_CHECK_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
      return { status: "ok", db: "up" };
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: "error", db: "down" };
    } finally {
      clearTimeout(timer);
    }
  }
}
