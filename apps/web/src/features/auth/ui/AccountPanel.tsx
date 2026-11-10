"use client";

import { useAuthControllerLogout, useMeControllerMe } from "@keepio/api-client";
import { useState } from "react";
import { NETWORK_ERROR_MESSAGE } from "@/shared/lib/network-error";
import { serverMessage, submit } from "../lib/server-message";
import { clearSession } from "../model/session-store";
import { AuthLayout, FormError, Notice } from "./FormParts";

// FEAT-006 AC-12. 로그인 상태에서만 렌더한다(AuthSwitch·RequireAuth 안. /api/me 조회).
// /api/me 쿼리: 생성 키, stale 기본값, 비로그인이 되면 AuthBootstrap이 캐시를 비운다
export function AccountPanel() {
  const me = useMeControllerMe();
  const logout = useAuthControllerLogout();
  const [error, setError] = useState<string | null>(null);

  const meError = me.isError
    ? NETWORK_ERROR_MESSAGE
    : me.data && me.data.status !== 200
      ? serverMessage(me.data)
      : null;

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
    // 비로그인 → 홈은 랜딩으로 바뀌고(AuthSwitch), AuthBootstrap이 캐시 정리
    clearSession();
  }

  return (
    <AuthLayout title="Keepio">
      {me.isPending && <Notice>불러오는 중이에요…</Notice>}
      {me.data?.status === 200 && (
        <dl className="flex flex-col gap-1 text-sm">
          <dt className="font-medium">이메일</dt>
          <dd>{me.data.data.email}</dd>
          <dt className="font-medium">이메일 인증</dt>
          <dd>{me.data.data.emailVerified ? "완료" : "인증 전이에요"}</dd>
        </dl>
      )}
      {/* 오류 영역은 하나(id 중복 방지). 로그아웃 오류가 우선 */}
      <FormError message={error ?? meError} />
      <button
        type="button"
        onClick={onLogout}
        disabled={logout.isPending}
        className="rounded border px-3 py-2 font-medium disabled:opacity-50"
      >
        로그아웃
      </button>
    </AuthLayout>
  );
}
