"use client";

import {
  apiUrl,
  getOAuthControllerStartUrl,
  useOAuthControllerProviders,
} from "@keepio/api-client";
import { navigateTo } from "../lib/navigate";

const LABELS = {
  google: "Google로 계속하기",
  kakao: "카카오로 계속하기",
} as const;

// FEAT-004 AC-11. 서버가 켜 둔 제공자만 보인다(목록은 서버가 권위). 누르면 페이지 전체가 API로 이동한다.
// /providers 쿼리: 생성 키, stale 기본값, 무효화 없음(설정은 배포 단위로만 바뀐다)
export function SocialLoginButtons() {
  const providers = useOAuthControllerProviders();
  const list =
    providers.data?.status === 200 ? providers.data.data.providers : [];
  if (list.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" aria-label="소셜 로그인">
      {list.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() =>
            navigateTo(apiUrl(getOAuthControllerStartUrl(provider)))
          }
          className="rounded border px-3 py-2 font-medium"
        >
          {LABELS[provider]}
        </button>
      ))}
    </div>
  );
}
