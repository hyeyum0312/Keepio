// ADR-009: 서버 응답이 없을 때(오프라인·타임아웃·연결 실패)만 쓰는 고정 문구. 서버가 응답했다면 그 message를 쓴다
export const NETWORK_ERROR_MESSAGE =
  "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.";
