import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import { ApiExceptionFilter } from "../common/api-exception.filter.js";

// FileInterceptor(multer)가 던지는 영어 오류를 FEAT-010 오류 표의 문구로 바꾼다(ADR-009)
@Catch(PayloadTooLargeException, BadRequestException)
export class UploadErrorFilter implements ExceptionFilter {
  private readonly base = new ApiExceptionFilter();

  catch(
    exception: PayloadTooLargeException | BadRequestException,
    host: ArgumentsHost,
  ) {
    const mapped =
      exception instanceof PayloadTooLargeException
        ? new ApiException(
            HttpStatus.PAYLOAD_TOO_LARGE,
            "IMAGE_TOO_LARGE",
            "이미지는 10MB까지 올릴 수 있어요.",
          )
        : new ApiException(
            HttpStatus.BAD_REQUEST,
            "UNSUPPORTED_IMAGE",
            "JPG·PNG·WEBP·GIF 이미지만 올릴 수 있어요.",
          );
    this.base.catch(mapped, host);
  }
}
