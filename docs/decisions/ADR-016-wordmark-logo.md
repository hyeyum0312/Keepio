# ADR-016: 로고는 워드마크, 캐릭터는 회사 마스코트로 분리

- Status: accepted (2026-11-19)
- Context / problem:
  - 레드 캐릭터 심볼이 로고와 캐릭터를 함께 맡았다. 로고는 16px 파비콘에서도 읽혀야 해 단순하고 고정돼야 하고, 캐릭터는 표정·포즈·움직임이 필요해 두 요구가 부딪쳤다.
  - 07-BRAND의 패밀리 브랜드 계획(1·2층 공유, 3층 대표색·로고만 서비스별)과도 캐릭터를 회사 층에 두는 편이 맞다.
  - 시안: [브랜드 / 로고 디자인](https://claude.ai/artifact/QFoV9g8zkXgcnhkHbohwdC) "keepio · Young Serif + 북마크 i" 보드.
- Options:
  - (a) 지금처럼 캐릭터 심볼 + 글자
  - (b) 워드마크만. 후보: 둥근 굵은 산세리프, 볼드·중간 굵기 산세리프, 개성 있는 폰트 8종, Young Serif + 북마크 i(Y1~Y4)
- Decision:
  - (b) Young Serif 워드마크 `keepio`(소문자, 마침표 없음), i 점 자리에 레드 북마크(Y2안). 글자는 잉크(라이트 `#20212A`, 다크는 밝은 글자), 북마크는 라이트 `#EE5041`·다크 `#FB8070`.
  - 작은 마크(파비콘·앱 아이콘·접힌 사이드바): 잉크 타일 + 레드 북마크. 캐릭터를 쓰지 않는다.
  - 캐릭터 패밀리는 회사 마스코트로 두고, 랜딩·인증 무대·온보딩·빈 상태에서만 쓴다(07-BRAND 7장).
- Consequences:
  - 코드: `shared/ui/KeepioWordmark`(워드마크·작은 마크), `--logo-*` 토큰, `app/favicon.ico`·`icon.png`·`apple-icon.png`. `KeepioMark`는 캐릭터 전용.
  - 폰트 Young Serif(OFL)를 next/font로 내려받는다(로고에만).
  - 되돌리기: 로고 컴포넌트와 아이콘 파일만 바꾸면 되고 데이터 영향은 없다.
