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

// message는 클라이언트가 가공 없이 보여주는 사용자 문구다(ADR-009)
const USER_MESSAGES = {
  validationFailed: "입력한 내용을 확인해 주세요.",
  notFound: "요청한 주소를 찾을 수 없어요.",
  httpError: "요청을 처리하지 못했어요.",
  internalError: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
} as const;

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
        // details는 class-validator 원문(개발자용). 사용자 문구는 message
        payload: {
          code: "VALIDATION_FAILED",
          message: USER_MESSAGES.validationFailed,
          requestId,
          details: messages,
        },
      };
    }
    // Nest 기본 메시지는 영어 개발자 문장이고, 라우트 없음("Cannot GET /path?query")은 쿼리를 되돌려주므로 쓰지 않는다
    return {
      status,
      payload: {
        code: HttpStatus[status] ?? "HTTP_ERROR",
        message:
          status === HttpStatus.NOT_FOUND
            ? USER_MESSAGES.notFound
            : USER_MESSAGES.httpError,
        requestId,
      },
    };
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    payload: {
      code: "INTERNAL_ERROR",
      message: USER_MESSAGES.internalError,
      requestId,
    },
  };
}
