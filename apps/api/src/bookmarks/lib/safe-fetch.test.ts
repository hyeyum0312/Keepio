import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isPublicAddress, safeFetch, SafeFetchError } from "./safe-fetch.js";

const OPTS = {
  maxBytes: 1024,
  timeoutMs: 2000,
  maxRedirects: 3,
  accept: "*/*",
  userAgent: "test",
};

describe("SSRF 방어 (FEAT-010 AC-10)", () => {
  it("AC-10: 사설·루프백·링크로컬·메타데이터 주소는 공개 주소가 아니다", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.0.10",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "not-an-ip",
    ]) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
  });

  it("AC-10: 일반 공개 주소는 통과한다", () => {
    for (const ip of ["8.8.8.8", "157.240.1.1", "2606:4700::1111"]) {
      expect(isPublicAddress(ip), ip).toBe(true);
    }
  });

  it("AC-10: IP 그대로 쓴 사설 주소와 localhost 이름은 연결 전에 거부한다", async () => {
    await expect(
      safeFetch("http://127.0.0.1:7711/health", OPTS),
    ).rejects.toThrow(SafeFetchError);
    await expect(safeFetch("http://[::1]/", OPTS)).rejects.toThrow(
      SafeFetchError,
    );
    await expect(safeFetch("http://localhost:7711/", OPTS)).rejects.toThrow(
      "blocked address",
    );
  });

  it("AC-10: http·https가 아닌 주소는 거부한다", async () => {
    await expect(safeFetch("file:///etc/passwd", OPTS)).rejects.toThrow(
      "unsupported url",
    );
  });
});

describe("safeFetch 동작 (로컬 가짜 서버, 주소 검사만 끔)", () => {
  let server: http.Server;
  let base = "";
  const local = { ...OPTS, isAllowedAddress: () => true };

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const n = Number(req.url?.split("/")[2] ?? 0);
      if (req.url?.startsWith("/hop/")) {
        res.writeHead(302, { location: n > 0 ? `/hop/${n - 1}` : "/ok" });
        return res.end();
      }
      if (req.url === "/ok") {
        res.writeHead(200, { "content-type": "text/html" });
        return res.end("<p>ok</p>");
      }
      if (req.url === "/big") {
        res.writeHead(200);
        return res.end("x".repeat(5000));
      }
      if (req.url === "/to-private") {
        res.writeHead(302, { location: "http://169.254.169.254/latest" });
        return res.end();
      }
      if (req.url === "/slow") return; // 응답하지 않음
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.closeAllConnections();
    server.close();
  });

  it("AC-10: 리다이렉트는 3번까지 따라가고 4번째는 거부한다", async () => {
    const ok = await safeFetch(`${base}/hop/2`, local);
    expect(ok.status).toBe(200);
    expect(ok.finalUrl).toBe(`${base}/ok`);
    await expect(safeFetch(`${base}/hop/3`, local)).rejects.toThrow(
      "too many redirects",
    );
  });

  it("AC-10: 응답이 상한을 넘으면 중단한다", async () => {
    await expect(safeFetch(`${base}/big`, local)).rejects.toThrow("too large");
  });

  it("AC-10: 리다이렉트 대상도 다시 검사한다(기본 검사)", async () => {
    // 첫 요청만 허용하고 이후 주소는 기본 규칙(공개 주소만)
    let first = true;
    const once = {
      ...OPTS,
      isAllowedAddress: (a: string) =>
        first ? ((first = false), true) : isPublicAddress(a),
    };
    await expect(safeFetch(`${base}/to-private`, once)).rejects.toThrow(
      "blocked address",
    );
  });

  it("AC-10: 시간 제한을 넘기면 중단한다", async () => {
    await expect(
      safeFetch(`${base}/slow`, { ...local, timeoutMs: 300 }),
    ).rejects.toThrow("timeout");
  });
});
