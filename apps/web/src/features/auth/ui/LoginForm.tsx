"use client";

import { useAuthControllerLogin } from "@keepio/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { submit } from "../lib/server-message";
import { setSession } from "../model/session-store";
import { useAuthStatus } from "../model/useAuthStatus";
import {
  AuthLayout,
  fieldValue,
  FormError,
  SubmitButton,
  TextField,
} from "./FormParts";
import { OAuthFailureAlert } from "./OAuthFailureAlert";
import { SocialLoginButtons } from "./SocialLoginButtons";

// FEAT-006 AC-09
export function LoginForm() {
  const router = useRouter();
  const status = useAuthStatus();
  const login = useAuthControllerLogin();
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인 상태면 홈으로
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

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
    if (result.res.status === 200) setSession(result.res.data.accessToken);
  }

  return (
    <AuthLayout title="로그인">
      <OAuthFailureAlert />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
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
        <SubmitButton pending={login.isPending}>로그인</SubmitButton>
      </form>
      <SocialLoginButtons />
      <nav className="flex justify-between text-sm">
        <Link href="/signup">가입하기</Link>
        <Link href="/forgot-password">비밀번호를 잊었어요</Link>
      </nav>
    </AuthLayout>
  );
}
