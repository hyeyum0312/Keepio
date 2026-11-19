"use client";

import { useAuthControllerLogout, useMeControllerMe } from "@keepio/api-client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { NETWORK_ERROR_MESSAGE } from "@/shared/lib/network-error";
import { serverMessage, submit } from "@/shared/lib/server-message";
import { FormError, Notice } from "@/shared/ui/FormParts";
import { clearSession } from "../model/session-store";
import { displayName } from "./AccountHeader";

const ERROR_ID = "account-menu-error";

const AVATAR_ART = "/bucket-art/coral.webp";
const ITEM =
  "flex min-h-11 items-center rounded-xl px-3 text-left text-sm hover:bg-muted focus-visible:focus-ring";

// 앱 틀(FEAT-009)의 계정 버튼: 동그란 버튼을 누르면 아이디·이메일 인증 안내·휴지통·설정·화면 모드·로그아웃이 열린다.
// 위쪽 막대(PC)와 모바일 머리에 두고 아래로 연다. 사용자 아바타가 생기기 전에는 그라데이션 원
export function AccountMenu({ open = "down" }: { open?: "up" | "down" }) {
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
        className="relative inline-flex size-11 cursor-pointer list-none items-center justify-center overflow-hidden rounded-full focus-visible:focus-ring [&::-webkit-details-marker]:hidden"
      >
        <Image
          src={AVATAR_ART}
          alt=""
          fill
          sizes="44px"
          className="object-cover"
        />
      </summary>
      <div
        className={`absolute z-30 flex w-64 flex-col gap-1 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[0_8px_24px_var(--shadow-soft)] ${
          open === "up" ? "bottom-13 left-0" : "top-13 right-0"
        }`}
      >
        <p className="truncate px-3 pt-2 pb-1 text-sm font-semibold">
          {name ?? "불러오는 중이에요…"}
        </p>
        {profile && !profile.emailVerified && profile.email && (
          <Notice>
            이메일 인증 전이에요. 받은 메일의 링크로 인증해 주세요.
          </Notice>
        )}
        <Link href="/trash" className={ITEM}>
          휴지통
        </Link>
        <span
          role="link"
          aria-disabled="true"
          title="준비 중"
          className={`${ITEM} cursor-default hover:bg-transparent`}
        >
          설정<span className="sr-only"> (준비 중)</span>
        </span>
        <div className="flex min-h-11 items-center justify-between gap-2 px-3 text-sm">
          화면 모드
          <ThemeToggle className="size-9!" />
        </div>
        <div className="my-1 border-t border-border-subtle" />
        <button
          type="button"
          onClick={onLogout}
          disabled={logout.isPending}
          className={`${ITEM} disabled:opacity-50`}
        >
          로그아웃
        </button>
        <FormError message={error ?? meError} id={ERROR_ID} />
      </div>
    </details>
  );
}
