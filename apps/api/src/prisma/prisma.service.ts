import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const CONNECTION_TIMEOUT_MS = 5_000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const env = loadEnv();
    // BACKEND.md: DB 풀 크기에 명시적 상한을 둔다
    const adapter = new PrismaPg({
      connectionString: env.databaseUrl,
      max: env.dbPoolMax,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
