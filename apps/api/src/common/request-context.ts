import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { Logger } from "@nestjs/common";

const REQUEST_ID_HEADER = "x-request-id";
const VALID_REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;
const QUIET_PATHS = new Set(["/health"]);

const storage = new AsyncLocalStorage<{ requestId: string }>();
const logger = new Logger("Http");

export function currentRequestId() {
  return storage.getStore()?.requestId ?? "unknown";
}

// 요청 ID를 정하고(외부 값은 형식 검증), 응답 헤더와 접근 로그에 남긴다.
// 로그에는 쿼리스트링을 넣지 않는다(URL에 민감한 값이 있을 수 있음)
export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId =
    incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, requestId);

  const startedAt = performance.now();
  res.on("finish", () => {
    if (res.statusCode < 400 && QUIET_PATHS.has(req.path)) return;
    logger.log({
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    });
  });

  storage.run({ requestId }, next);
}
