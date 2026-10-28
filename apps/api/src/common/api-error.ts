import { HttpException, type HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

// 모든 오류 응답의 형태(ADR-006). OpenAPI extraModels로 클라이언트 타입에 포함된다
export class ApiErrorResponse {
  @ApiProperty({ example: "VALIDATION_FAILED" })
  code!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  requestId!: string;

  @ApiProperty({ type: [String], required: false })
  details?: string[];
}

// 도메인 오류는 이 예외로 던진다. code는 UPPER_SNAKE_CASE 안정 식별자
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
  ) {
    super(message, status);
  }
}
