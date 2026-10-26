import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const DEFAULT_POOL_MAX = 10;
const CONNECTION_TIMEOUT_MS = 5_000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // BACKEND.md: DB 풀 크기에 명시적 상한을 둔다
    const adapter = new PrismaPg({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? DEFAULT_POOL_MAX),
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
