"use client";

import { useAuthControllerRequestPasswordReset } from "@keepio/api-client";
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

// FEAT-006 AC-10. 가입 여부와 무관하게 같은 안내(FEAT-003 AC-14)
export function ForgotPasswordForm() {
  const request = useAuthControllerRequestPasswordReset();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const result = await submit(
      () => request.mutateAsync({ data: { email: fieldValue(form, "email") } }),
      (res) => res.status === 202,
    );
    if (result.ok) setSent(true);
    else setError(result.message);
  }

  return (
    <AuthLayout title="비밀번호 찾기">
      {sent ? (
        <Notice>
          가입된 이메일이면 비밀번호 재설정 메일을 보냈어요. 링크는 30분 동안 쓸
          수 있어요.
        </Notice>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            label="이메일"
            name="email"
            type="email"
            autoComplete="email"
            hasError={!!error}
          />
          <FormError message={error} />
          <SubmitButton pending={request.isPending}>
            재설정 메일 받기
          </SubmitButton>
        </form>
      )}
      <Link href="/login" className="text-sm">
        로그인으로 돌아가기
      </Link>
    </AuthLayout>
  );
}
