import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiProperty,
  ApiServiceUnavailableResponse,
} from "@nestjs/swagger";
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
  async check(): Promise<HealthResponse> {
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
      throw new ServiceUnavailableException({
        status: "error",
        db: "down",
      } satisfies HealthResponse);
    } finally {
      clearTimeout(timer);
    }
  }
}
