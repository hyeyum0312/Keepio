const NODE_ENVS = ["development", "test", "production"] as const;
const DEFAULT_PORT = 7711;
const DEFAULT_DB_POOL_MAX = 10;
const MAX_DB_POOL = 100;
const MIN_JWT_SECRET_BYTES = 32;
const MAX_TRUST_PROXY_HOPS = 10;
export const OAUTH_PROVIDERS = ["google", "kakao"] as const;
export type OAuthProviderName = (typeof OAUTH_PROVIDERS)[number];
export type OAuthCredentials = { clientId: string; clientSecret: string };

export type Env = {
  nodeEnv: (typeof NODE_ENVS)[number];
  port: number;
  databaseUrl: string;
  dbPoolMax: number;
  webOrigin?: string;
  jwtSecret: string;
  // 운영에서만 필수. 개발·테스트는 실제 메일을 보내지 않는다(FEAT-003)
  resendApiKey?: string;
  mailFrom?: string;
  // 앞단 프록시 개수. X-Forwarded-For를 이만큼만 믿는다(0이면 믿지 않음)
  trustProxyHops: number;
  // 소셜 로그인(FEAT-004). ID·Secret이 둘 다 있는 제공자만 켜진다
  oauth: Partial<Record<OAuthProviderName, OAuthCredentials>>;
  // 제공자에 넘기는 콜백 주소의 기준. 개발·테스트는 비어 있으면 http://localhost:PORT
  apiOrigin?: string;
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

  const isProduction = nodeEnv === "production";
  // 메일 링크와 쿠키 요청의 Origin 검사에 쓴다
  if (isProduction && !webOrigin) {
    problems.push("WEB_ORIGIN is required in production");
  }

  // 기본값을 두지 않는다. 코드의 기본값이 운영까지 따라가는 사고를 막는다
  const jwtSecret = source.JWT_SECRET ?? "";
  if (Buffer.byteLength(jwtSecret, "utf8") < MIN_JWT_SECRET_BYTES) {
    problems.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_BYTES} bytes`);
  }

  const resendApiKey = source.RESEND_API_KEY || undefined;
  if (isProduction && !resendApiKey) {
    problems.push("RESEND_API_KEY is required in production");
  }

  const mailFrom = source.MAIL_FROM || undefined;
  if (mailFrom && !mailFrom.includes("@")) {
    problems.push("MAIL_FROM must contain an email address");
  } else if (isProduction && !mailFrom) {
    problems.push("MAIL_FROM is required in production");
  }

  const trustProxyHops = parseIntInRange(
    source.TRUST_PROXY_HOPS,
    0,
    0,
    MAX_TRUST_PROXY_HOPS,
  );
  if (trustProxyHops === undefined) {
    problems.push(
      `TRUST_PROXY_HOPS must be an integer 0-${MAX_TRUST_PROXY_HOPS}`,
    );
  }

  const oauth: Env["oauth"] = {};
  for (const provider of OAUTH_PROVIDERS) {
    const prefix = provider.toUpperCase();
    const clientId = source[`${prefix}_CLIENT_ID`] || undefined;
    const clientSecret = source[`${prefix}_CLIENT_SECRET`] || undefined;
    if (clientId && clientSecret) oauth[provider] = { clientId, clientSecret };
    else if (clientId || clientSecret) {
      problems.push(
        `${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET must be set together`,
      );
    }
  }

  let apiOrigin = source.API_ORIGIN || undefined;
  if (apiOrigin && !isUrlWithProtocol(apiOrigin, ["http:", "https:"])) {
    problems.push("API_ORIGIN must be an http(s) URL");
  }
  if (!apiOrigin && !isProduction && port !== undefined) {
    apiOrigin = `http://localhost:${port}`;
  }
  if (isProduction && !apiOrigin && Object.keys(oauth).length > 0) {
    problems.push(
      "API_ORIGIN is required in production when social login is enabled",
    );
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
    jwtSecret,
    resendApiKey,
    mailFrom,
    trustProxyHops: trustProxyHops!,
    oauth,
    apiOrigin: apiOrigin?.replace(/\/$/, ""),
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
