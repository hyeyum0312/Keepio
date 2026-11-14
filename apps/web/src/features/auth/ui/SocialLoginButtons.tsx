"use client";

import {
  apiUrl,
  getOAuthControllerStartUrl,
  useOAuthControllerProviders,
} from "@keepio/api-client";
import Image from "next/image";
import { useState } from "react";
import { navigateTo } from "../lib/navigate";
import {
  type LoginMethod,
  rememberPendingSocialLogin,
} from "../model/last-login-method";
import { RecentBadge } from "./RecentBadge";

// 문구·색·로고는 제공자 가이드 우선(07-BRAND 3.2, FEAT-007 AC-05). 카카오 로고는 공식 에셋으로 교체 예정(FEAT-007 비범위)
const PROVIDERS = {
  kakao: {
    label: "카카오 로그인",
    icon: "/svg/social-kakao.svg",
    className: "border-kakao bg-kakao text-kakao-foreground",
  },
  google: {
    label: "Google 로그인",
    icon: "/svg/social-google.svg",
    className: "border-google-border bg-google text-google-foreground",
  },
} as const;
// 국내 사용자 기준 카카오 먼저. 두 버튼은 같은 크기·무게(Google 가이드)
const ORDER = ["kakao", "google"] as const;

// FEAT-004 AC-11. 서버가 켜 둔 제공자만 보인다(목록은 서버가 권위). 누르면 페이지 전체가 API로 이동한다.
// /providers 쿼리: 생성 키, stale 기본값, 무효화 없음(설정은 배포 단위로만 바뀐다)
export function SocialLoginButtons({
  recent = null,
  note,
}: {
  recent?: LoginMethod | null;
  // 버튼이 하나라도 있을 때만 버튼 아래에 보이는 안내
  note?: string;
}) {
  const providers = useOAuthControllerProviders();
  const enabled =
    providers.data?.status === 200 ? providers.data.data.providers : [];
  // 카카오는 키 발급 전이어도 버튼(UI)을 보여 준다(FEAT-007 AC-05, 사용자 결정). 서버가 켜지 않았으면 누를 때 준비 중 안내만
  const list = ORDER.filter((p) => p === "kakao" || enabled.includes(p));
  const [notReady, setNotReady] = useState(false);

  return (
    <div className="flex flex-col gap-3" aria-label="소셜 로그인">
      {list.map((provider) => {
        const { label, icon, className } = PROVIDERS[provider];
        return (
          <div key={provider} className="relative">
            <button
              type="button"
              onClick={() => {
                if (!enabled.includes(provider)) {
                  setNotReady(true);
                  return;
                }
                rememberPendingSocialLogin(provider);
                navigateTo(apiUrl(getOAuthControllerStartUrl(provider)));
              }}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-base font-semibold focus-visible:focus-ring ${className}`}
            >
              <Image
                src={icon}
                alt=""
                aria-hidden="true"
                unoptimized
                width={18}
                height={18}
              />
              {label}
            </button>
            {recent === provider && <RecentBadge />}
          </div>
        );
      })}
      {notReady && (
        <p role="status" className="text-center text-sm text-muted-foreground">
          카카오 로그인은 준비 중이에요. 다른 방법으로 로그인해 주세요.
        </p>
      )}
      {note && (
        <p className="text-center text-xs text-muted-foreground">{note}</p>
      )}
    </div>
  );
}
