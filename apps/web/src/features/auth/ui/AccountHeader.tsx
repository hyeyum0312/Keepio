"use client";

import { useAuthControllerLogout, useMeControllerMe } from "@keepio/api-client";
import { useState } from "react";
import { NETWORK_ERROR_MESSAGE } from "@/shared/lib/network-error";
import { serverMessage, submit } from "@/shared/lib/server-message";
import { FormError, Notice } from "@/shared/ui/FormParts";
import { Logo } from "@/shared/ui/Logo";
import { clearSession } from "../model/session-store";

const ERROR_ID = "account-error";

// 이메일이 없는 계정(소셜, 이메일 미동의)은 계정 ID 앞부분
export function displayName(me: { id: string; email: string | null }) {
  return `my-${me.email ? me.email.split("@")[0] : me.id.slice(0, 8)}`;
}

// FEAT-006 AC-12. 로그인 홈 상단: my-아이디, 로그아웃. 이메일 인증 전이면 안내(FEAT-003 AC-06).
// 로그인 상태에서만 렌더한다(/api/me 조회). 비로그인이 되면 홈은 랜딩으로, AuthBootstrap이 캐시 정리
export function AccountHeader() {
  const me = useMeControllerMe();
  const logout = useAuthControllerLogout();
  const [error, setError] = useState<string | null>(null);

  const meError = me.isError
    ? NETWORK_ERROR_MESSAGE
    : me.data && me.data.status !== 200
      ? serverMessage(me.data)
      : null;
  const profile = me.data?.status === 200 ? me.data.data : null;

  async function onLogout() {
    setError(null);
    const r = await submit(
      () => logout.mutateAsync(),
      (res) => res.status === 204,
    );
    if (!r.ok) {
      setError(r.message);
      return;
    }
    clearSession();
  }

  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          <p className="font-semibold">
            {profile ? displayName(profile) : "불러오는 중이에요…"}
          </p>
          <button
            type="button"
            onClick={onLogout}
            disabled={logout.isPending}
            className="rounded border px-3 py-1 text-sm font-medium disabled:opacity-50"
          >
            로그아웃
          </button>
        </div>
      </div>
      {profile && !profile.emailVerified && profile.email && (
        <Notice>이메일 인증 전이에요. 받은 메일의 링크로 인증해 주세요.</Notice>
      )}
      {/* 오류 영역은 하나(id 중복 방지). 로그아웃 오류가 우선 */}
      <FormError message={error ?? meError} id={ERROR_ID} />
    </header>
  );
}
