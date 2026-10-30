import { HttpException, type HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

// 모든 오류 응답의 형태(ADR-006). OpenAPI extraModels로 클라이언트 타입에 포함된다
export class ApiErrorResponse {
  @ApiProperty({ example: "VALIDATION_FAILED" })
  code!: string;

  @ApiProperty({
    description: "사용자에게 그대로 보여주는 문구. 분기는 code로 한다",
  })
  message!: string;

  @ApiProperty()
  requestId!: string;

  @ApiProperty({ type: [String], required: false })
  details?: string[];
}

// 도메인 오류는 이 예외로 던진다. code는 UPPER_SNAKE_CASE 안정 식별자.
// extra는 클라이언트 동작에 필요한 값(예: 복구할 bookmarkId). 쓰면 ApiErrorResponse를 상속한 응답 타입으로 문서화한다
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly extra?: Record<string, string>,
  ) {
    super(message, status);
  }
}
