"use client";

import { useAuthControllerLogin } from "@keepio/api-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { submit } from "@/shared/lib/server-message";
import {
  buttonClass,
  fieldValue,
  FormError,
  SubmitButton,
  TextField,
} from "@/shared/ui/FormParts";
import {
  saveLastLoginMethod,
  useLastLoginMethod,
} from "../model/last-login-method";
import { setSession } from "../model/session-store";
import { useAuthStatus } from "../model/useAuthStatus";
import { AuthStage, Divider } from "./AuthStage";
import { BackLink } from "./BackLink";
import { OAuthFailureAlert } from "./OAuthFailureAlert";
import { RecentBadge } from "./RecentBadge";
import { SocialLoginButtons } from "./SocialLoginButtons";

const EMAIL_MODE = "/login?method=email";

// 시작 화면(로그인·가입 공용, FEAT-007 AC-01~05). 주소를 읽는 부분만 Suspense로 감싼다
export function LoginForm() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const router = useRouter();
  const status = useAuthStatus();
  const emailMode = useSearchParams().get("method") === "email";
  const recent = useLastLoginMethod();
  // 소셜로 돌아갔다가 다시 열어도 입력한 이메일은 남긴다(AC-02)
  const [email, setEmail] = useState("");

  // FEAT-006 AC-09: 이미 로그인 상태면 홈으로
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  return (
    <AuthStage
      title={
        <>
          저장한 링크를
          {/* 이메일 모드 PC는 한 줄로 줄여 스크롤 없이 한 화면에(FEAT-007 AC-02) */}
          <br className={emailMode ? "md:hidden" : undefined} />
          {emailMode ? " " : null}다시 만나는 곳
        </>
      }
      subtitle={
        emailMode ? undefined : (
          <>
            공유 한 번이면 저장하고,
            <br />
            알아서 정리해 드려요.
          </>
        )
      }
      compact={emailMode}
    >
      <OAuthFailureAlert />
      {emailMode ? (
        <EmailLogin email={email} onEmailChange={setEmail} />
      ) : (
        <div className="flex flex-col gap-3">
          <SocialLoginButtons
            recent={recent}
            note="카카오·Google은 처음이면 자동으로 가입돼요."
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => router.push(EMAIL_MODE)}
              className={buttonClass.secondary}
            >
              이메일로 로그인
            </button>
            {recent === "email" && <RecentBadge />}
          </div>
        </div>
      )}
      <Divider />
      <SignupLink />
    </AuthStage>
  );
}

function EmailLogin({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) {
  const login = useAuthControllerLogin();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const result = await submit(
      () =>
        login.mutateAsync({
          data: {
            email: fieldValue(form, "email"),
            password: fieldValue(form, "password"),
          },
        }),
      (res) => res.status === 200,
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.res.status === 200) {
      saveLastLoginMethod("email");
      setSession(result.res.data.accessToken);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <BackLink href="/login">카카오·Google로 로그인</BackLink>
      <TextField
        label="이메일"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoFocus
        value={email}
        onChange={onEmailChange}
        hasError={!!error}
      />
      <TextField
        label="비밀번호"
        name="password"
        type="password"
        autoComplete="current-password"
        hasError={!!error}
      />
      <FormError message={error} />
      <Link
        href="/forgot-password"
        className="self-end py-1 text-sm text-muted-foreground focus-visible:focus-ring"
      >
        비밀번호를 잊으셨나요?
      </Link>
      <SubmitButton pending={login.isPending}>로그인</SubmitButton>
    </form>
  );
}

function SignupLink() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      아직 계정이 없나요?{" "}
      <Link
        href="/signup"
        className="font-semibold text-foreground underline underline-offset-4 focus-visible:focus-ring"
      >
        회원가입
      </Link>
    </p>
  );
}
