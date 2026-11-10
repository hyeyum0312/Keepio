"use client";

import { useAuthControllerConfirmPasswordReset } from "@keepio/api-client";
import Link from "next/link";
import { useState } from "react";
import { submit } from "@/shared/lib/server-message";
import { useOneTimeUrlToken } from "../model/useOneTimeUrlToken";
import {
  AuthLayout,
  fieldValue,
  FormError,
  Notice,
  SubmitButton,
  TextField,
} from "@/shared/ui/FormParts";

// FEAT-006 AC-11. 토큰이 없거나 잘못됐으면 서버가 INVALID_TOKEN 문구를 준다(프론트가 문구를 만들지 않는다)
export function ResetPasswordForm() {
  const token = useOneTimeUrlToken();
  const confirm = useAuthControllerConfirmPasswordReset();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const result = await submit(
      () =>
        confirm.mutateAsync({
          data: { token, newPassword: fieldValue(form, "newPassword") },
        }),
      (res) => res.status === 204,
    );
    if (result.ok) setDone(true);
    else setError(result.message);
  }

  if (done) {
    return (
      <AuthLayout title="비밀번호를 바꿨어요">
        <Notice>새 비밀번호로 다시 로그인해 주세요.</Notice>
        <Link href="/login" className="text-sm">
          로그인하러 가기
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="새 비밀번호 정하기">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="새 비밀번호 (8자 이상)"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hasError={!!error}
        />
        <FormError message={error} />
        <SubmitButton pending={confirm.isPending}>비밀번호 바꾸기</SubmitButton>
      </form>
      <Link href="/forgot-password" className="text-sm">
        재설정 메일 다시 받기
      </Link>
    </AuthLayout>
  );
}
