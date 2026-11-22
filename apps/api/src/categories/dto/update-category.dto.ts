import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

// FEAT-008 AC-15. 보낸 항목만 고친다. 이름 변경(AC-02)은 다음 범위에서 `name`을 더한다
export class UpdateCategoryDto {
  @ApiPropertyOptional({
    type: Boolean,
    description:
      "고정 여부. 고정한 카테고리는 목록 맨 위에 온다(사용자당 8개까지). 같은 값을 다시 보내도 성공한다",
  })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
