"use client";

import { useAuthControllerLogout, useMeControllerMe } from "@keepio/api-client";
import { useState } from "react";
import { NETWORK_ERROR_MESSAGE } from "@/shared/lib/network-error";
import { serverMessage, submit } from "@/shared/lib/server-message";
import { FormError, Notice } from "@/shared/ui/FormParts";
import { clearSession } from "../model/session-store";
import { displayName } from "./AccountHeader";

const ERROR_ID = "account-menu-error";

// 앱 틀(FEAT-009)의 계정 버튼: 동그란 버튼을 누르면 아이디·이메일 인증 안내·로그아웃이 열린다.
// 사이드바(아래에서 위로 열림)와 모바일 머리(위에서 아래로 열림)에 같은 것을 쓴다
export function AccountMenu({ open = "up" }: { open?: "up" | "down" }) {
  const me = useMeControllerMe();
  const logout = useAuthControllerLogout();
  const [error, setError] = useState<string | null>(null);

  const meError = me.isError
    ? NETWORK_ERROR_MESSAGE
    : me.data && me.data.status !== 200
      ? serverMessage(me.data)
      : null;
  const profile = me.data?.status === 200 ? me.data.data : null;
  const name = profile ? displayName(profile) : null;

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
    <details className="relative">
      <summary
        aria-label="계정 메뉴"
        className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-muted text-sm font-semibold focus-visible:focus-ring [&::-webkit-details-marker]:hidden"
      >
        {name ? name.charAt(3).toUpperCase() : "·"}
      </summary>
      <div
        className={`absolute z-30 flex w-60 flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3 ${
          open === "up" ? "bottom-13 left-0" : "top-13 right-0"
        }`}
      >
        <p className="truncate text-sm font-semibold">
          {name ?? "불러오는 중이에요…"}
        </p>
        {profile && !profile.emailVerified && profile.email && (
          <Notice>
            이메일 인증 전이에요. 받은 메일의 링크로 인증해 주세요.
          </Notice>
        )}
        <button
          type="button"
          onClick={onLogout}
          disabled={logout.isPending}
          className="min-h-10 rounded-xl px-3 text-left text-sm hover:bg-muted focus-visible:focus-ring disabled:opacity-50"
        >
          로그아웃
        </button>
        <FormError message={error ?? meError} id={ERROR_ID} />
      </div>
    </details>
  );
}
