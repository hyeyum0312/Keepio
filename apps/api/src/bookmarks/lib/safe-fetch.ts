import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";

// FEAT-010 AC-10. 사용자가 준 링크를 서버가 받아 올 때의 SSRF 방어(BACKEND.md External URLs).
// - http·https만, 리다이렉트는 직접 따라가며 매 단계 다시 검사
// - 연결 직전 DNS 결과로 판정(lookup 훅): 검사 후 다른 IP로 바뀌는 rebinding을 막는다
// - 전체 시간·응답 바이트 상한, 압축 응답은 받지 않는다(압축 폭탄 방지)
export type SafeFetchOptions = {
  maxBytes: number;
  // 상한을 넘을 때: reject(기본) — 에러, truncate — 상한까지 받은 것만 돌려준다(페이지 앞부분만 필요할 때, AC-13)
  overLimit?: "reject" | "truncate";
  timeoutMs: number;
  maxRedirects: number;
  accept: string;
  userAgent: string;
  // 브라우저가 붙이는 요청 성격 헤더(sec-fetch-*). document: 페이지 열기, image: 이미지 불러오기
  purpose?: "document" | "image";
  // 테스트에서 로컬 가짜 서버로 리다이렉트·크기 제한을 검증할 때만 바꾼다. 운영 코드는 넘기지 않는다
  isAllowedAddress?: (address: string) => boolean;
};
export type SafeFetchResult = {
  finalUrl: string;
  status: number;
  contentType: string;
  body: Buffer;
  // overLimit: "truncate"로 상한에서 끊었을 때 true
  truncated: boolean;
};
export class SafeFetchError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "SafeFetchError";
  }
}

const BLOCKED = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  BLOCKED.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
  ["64:ff9b::", 96],
] as const) {
  BLOCKED.addSubnet(net, prefix, "ipv6");
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !BLOCKED.check(address, "ipv4");
  if (family === 6) {
    // IPv4-mapped(::ffff:a.b.c.d)는 IPv4 규칙으로 본다
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
    if (mapped) return !BLOCKED.check(mapped[1], "ipv4");
    return !BLOCKED.check(address, "ipv6");
  }
  return false;
}

// 연결 직전에 호출된다. 사설·루프백 등으로 풀리면 연결 자체를 거부한다
const guardedLookup = (isAllowed: (address: string) => boolean) =>
  function (
    hostname: string,
    options: { all?: boolean },
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string | LookupAddress[],
      family?: number,
    ) => void,
  ) {
    dnsLookup(hostname, { all: true }, (err, addresses) => {
      if (err) return callback(err, "");
      const list = addresses as LookupAddress[];
      if (list.length === 0 || !list.every((a) => isAllowed(a.address))) {
        return callback(new SafeFetchError("blocked address"), "");
      }
      if (options.all) return callback(null, list);
      callback(null, list[0].address, list[0].family);
    });
  };

export async function safeFetch(
  url: string,
  options: SafeFetchOptions,
): Promise<SafeFetchResult> {
  const deadline = Date.now() + options.timeoutMs;
  let current = url;
  for (let hop = 0; hop <= options.maxRedirects; hop++) {
    const target = URL.parse(current);
    if (
      !target ||
      (target.protocol !== "http:" && target.protocol !== "https:")
    ) {
      throw new SafeFetchError("unsupported url");
    }
    // 주소가 IP 그대로면 lookup 훅을 거치지 않으므로 여기서 판정한다
    const literal = target.hostname.replace(/^\[|\]$/g, "");
    const isAllowed = options.isAllowedAddress ?? isPublicAddress;
    if (isIP(literal) && !isAllowed(literal)) {
      throw new SafeFetchError("blocked address");
    }
    const res = await requestOnce(target, options, deadline);
    if (res.status >= 300 && res.status < 400 && res.location) {
      current = new URL(res.location, target).href;
      continue;
    }
    return { ...res, finalUrl: target.href };
  }
  throw new SafeFetchError("too many redirects");
}

type Once = SafeFetchResult & { location?: string };

function requestOnce(
  target: URL,
  options: SafeFetchOptions,
  deadline: number,
): Promise<Omit<Once, "finalUrl">> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) return Promise.reject(new SafeFetchError("timeout"));
  const client = target.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      target,
      {
        method: "GET",
        lookup: guardedLookup(
          options.isAllowedAddress ?? isPublicAddress,
        ) as never,
        headers: {
          "user-agent": options.userAgent,
          accept: options.accept,
          "accept-encoding": "identity",
          "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          ...browserHints(options.purpose),
        },
        timeout: remaining,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({
            status,
            contentType: "",
            body: Buffer.alloc(0),
            truncated: false,
            location,
          });
        }
        const truncate = options.overLimit === "truncate";
        const declared = Number(res.headers["content-length"]);
        if (
          !truncate &&
          Number.isFinite(declared) &&
          declared > options.maxBytes
        ) {
          res.destroy();
          return reject(new SafeFetchError("too large"));
        }
        const contentType = String(res.headers["content-type"] ?? "");
        const chunks: Buffer[] = [];
        let size = 0;
        let cut = false;
        res.on("data", (chunk: Buffer) => {
          if (cut) return;
          if (size + chunk.length > options.maxBytes) {
            if (!truncate) {
              res.destroy();
              reject(new SafeFetchError("too large"));
              return;
            }
            // 상한까지만 담고 나머지는 받지 않는다. destroy 뒤에는 end가 오지 않으므로 여기서 끝낸다
            cut = true;
            chunks.push(chunk.subarray(0, options.maxBytes - size));
            res.destroy();
            resolve({
              status,
              contentType,
              body: Buffer.concat(chunks),
              truncated: true,
            });
            return;
          }
          size += chunk.length;
          chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({
            status,
            contentType,
            body: Buffer.concat(chunks),
            truncated: false,
          }),
        );
        res.on("error", reject);
      },
    );
    const timer = setTimeout(
      () => req.destroy(new SafeFetchError("timeout")),
      remaining,
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("timeout")));
    req.on("error", reject);
    req.on("close", () => clearTimeout(timer));
    req.end();
  });
}

// 브라우저와 같은 요청 성격 헤더. 봇 차단(WAF)이 이 값이 없는 요청을 막는 경우가 많다
function browserHints(
  purpose: SafeFetchOptions["purpose"],
): Record<string, string> {
  if (purpose === "document") {
    return {
      "upgrade-insecure-requests": "1",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
    };
  }
  if (purpose === "image") {
    return {
      "sec-fetch-dest": "image",
      "sec-fetch-mode": "no-cors",
      "sec-fetch-site": "cross-site",
    };
  }
  return {};
}
