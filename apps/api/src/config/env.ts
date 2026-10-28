const NODE_ENVS = ["development", "test", "production"] as const;
const DEFAULT_PORT = 7711;
const DEFAULT_DB_POOL_MAX = 10;
const MAX_DB_POOL = 100;

export type Env = {
  nodeEnv: (typeof NODE_ENVS)[number];
  port: number;
  databaseUrl: string;
  dbPoolMax: number;
  webOrigin?: string;
};

// 시작 시 한 번 검증하고 실패하면 바로 종료한다. 메시지에 값은 넣지 않는다(비밀값 노출 방지)
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const problems: string[] = [];

  const nodeEnv = (source.NODE_ENV ?? "development") as Env["nodeEnv"];
  if (!NODE_ENVS.includes(nodeEnv)) {
    problems.push(`NODE_ENV must be one of ${NODE_ENVS.join(", ")}`);
  }

  const port = parseIntInRange(source.PORT, DEFAULT_PORT, 1, 65_535);
  if (port === undefined) problems.push("PORT must be an integer 1-65535");

  const dbPoolMax = parseIntInRange(
    source.DB_POOL_MAX,
    DEFAULT_DB_POOL_MAX,
    1,
    MAX_DB_POOL,
  );
  if (dbPoolMax === undefined) {
    problems.push(`DB_POOL_MAX must be an integer 1-${MAX_DB_POOL}`);
  }

  const databaseUrl = source.DATABASE_URL ?? "";
  if (!isUrlWithProtocol(databaseUrl, ["postgresql:", "postgres:"])) {
    problems.push("DATABASE_URL must be a postgresql:// URL");
  }

  const webOrigin = source.WEB_ORIGIN || undefined;
  if (webOrigin && !isUrlWithProtocol(webOrigin, ["http:", "https:"])) {
    problems.push("WEB_ORIGIN must be an http(s) URL");
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment:\n- ${problems.join("\n- ")}`);
  }
  return {
    nodeEnv,
    port: port!,
    databaseUrl,
    dbPoolMax: dbPoolMax!,
    webOrigin,
  };
}

function parseIntInRange(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;
}

function isUrlWithProtocol(raw: string, protocols: string[]) {
  try {
    return protocols.includes(new URL(raw).protocol);
  } catch {
    return false;
  }
}
