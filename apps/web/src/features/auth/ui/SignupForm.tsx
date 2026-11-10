"use client";

import { useAuthControllerSignup } from "@keepio/api-client";
import Link from "next/link";
import { useState } from "react";
import { submit } from "@/shared/lib/server-message";
import {
  AuthLayout,
  fieldValue,
  FormError,
  Notice,
  SubmitButton,
  TextField,
} from "@/shared/ui/FormParts";
import { SocialLoginButtons } from "./SocialLoginButtons";

// FEAT-006 AC-07. 서버는 이미 가입된 이메일에도 같은 202를 준다(FEAT-003 AC-03)
export function SignupForm() {
  const signup = useAuthControllerSignup();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const result = await submit(
      () =>
        signup.mutateAsync({
          data: {
            email: fieldValue(form, "email"),
            password: fieldValue(form, "password"),
          },
        }),
      (res) => res.status === 202,
    );
    if (result.ok) setSent(true);
    else setError(result.message);
  }

  if (sent) {
    return (
      <AuthLayout title="메일을 확인해 주세요">
        <Notice>
          입력한 주소로 인증 메일을 보냈어요. 메일의 링크를 눌러 인증을 마쳐
          주세요.
        </Notice>
        <Link href="/login" className="text-sm">
          로그인하러 가기
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="가입하기">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
          hasError={!!error}
        />
        <TextField
          label="비밀번호 (8자 이상)"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hasError={!!error}
        />
        <FormError message={error} />
        <SubmitButton pending={signup.isPending}>가입하기</SubmitButton>
      </form>
      <SocialLoginButtons />
      <Link href="/login" className="text-sm">
        이미 계정이 있어요
      </Link>
    </AuthLayout>
  );
}
