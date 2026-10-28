import { QueryClient } from "@tanstack/react-query";

// FRONTEND.md Network / state 기본 정책. 수치 캐시(staleTime·gcTime)는 측정 전이라 라이브러리 기본값을 쓴다.
// - refetchOnWindowFocus: false — WebView·탭 전환마다 전체 재요청이 일어나지 않게
// - retry: 쿼리 1회(일시적 네트워크 오류), 뮤테이션 0회(중복 저장 방지는 서버가 보장하지만 사용자 의도 없는 재전송은 하지 않음)
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, retry: 1 },
      mutations: { retry: 0 },
    },
  });
}
