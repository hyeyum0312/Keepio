import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiException, type ApiErrorResponse } from "./api-error.js";
import { currentRequestId } from "./request-context.js";

const logger = new Logger("Error");

// 모든 예외를 ApiErrorResponse 형태로 바꾼다. 500의 원인은 로그에만 남긴다
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const requestId = currentRequestId();
    const body = toErrorBody(exception, requestId);

    if (body.status >= 500) {
      logger.error(
        { requestId, code: body.payload.code },
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    res.status(body.status).json(body.payload);
  }
}

function toErrorBody(
  exception: unknown,
  requestId: string,
): { status: number; payload: ApiErrorResponse } {
  if (exception instanceof ApiException) {
    return {
      status: exception.getStatus(),
      payload: { code: exception.code, message: exception.message, requestId },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const messages =
      typeof response === "object" &&
      response !== null &&
      "message" in response &&
      Array.isArray(response.message)
        ? response.message.map(String)
        : undefined;
    // ValidationPipe는 메시지 배열을 담은 400을 던진다
    if (status === HttpStatus.BAD_REQUEST && messages) {
      return {
        status,
        payload: {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
          requestId,
          details: messages,
        },
      };
    }
    return {
      status,
      payload: {
        code: HttpStatus[status] ?? "HTTP_ERROR",
        // 라우트 없음 기본 메시지("Cannot GET /path?query")는 쿼리를 되돌려주므로 쓰지 않는다
        message:
          status === HttpStatus.NOT_FOUND ? "Not found" : exception.message,
        requestId,
      },
    };
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    payload: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId,
    },
  };
}
