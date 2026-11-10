"use client";

import {
  useAuthControllerResendVerification,
  useAuthControllerVerifyEmail,
} from "@keepio/api-client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type Result =
  | { state: "pending" }
  | { state: "done" }
  | { state: "failed"; message: string };

// FEAT-006 AC-08. 페이지에 들어오면 한 번만 인증을 요청한다(토큰은 1회용이라 두 번 보내면 두 번째가 실패한다).
// StrictMode의 effect 재실행에도 ref는 유지되어 한 번만 보낸다
export function VerifyEmail() {
  const token = useOneTimeUrlToken();
  const verify = useAuthControllerVerifyEmail();
  const started = useRef(false);
  const [result, setResult] = useState<Result>({ state: "pending" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void submit(
      () => verify.mutateAsync({ data: { token } }),
      (res) => res.status === 204,
    ).then((r) =>
      setResult(
        r.ok ? { state: "done" } : { state: "failed", message: r.message },
      ),
    );
  }, [token, verify]);

  if (result.state === "pending") {
    return (
      <AuthLayout title="이메일 인증">
        <Notice>인증하는 중이에요…</Notice>
      </AuthLayout>
    );
  }

  if (result.state === "done") {
    return (
      <AuthLayout title="이메일 인증 완료">
        <Notice>이메일 인증이 끝났어요.</Notice>
        <Link href="/" className="text-sm">
          홈으로 가기
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="이메일 인증">
      <FormError message={result.message} />
      <ResendVerification />
    </AuthLayout>
  );
}

function ResendVerification() {
  const resend = useAuthControllerResendVerification();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const r = await submit(
      () => resend.mutateAsync({ data: { email: fieldValue(form, "email") } }),
      (res) => res.status === 202,
    );
    if (r.ok) setSent(true);
    else setError(r.message);
  }

  if (sent) {
    return <Notice>인증 전인 가입 이메일이면 새 인증 메일을 보냈어요.</Notice>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="인증 메일 다시 받을 이메일"
        name="email"
        type="email"
        autoComplete="email"
        hasError={!!error}
      />
      <FormError message={error} />
      <SubmitButton pending={resend.isPending}>
        인증 메일 다시 받기
      </SubmitButton>
    </form>
  );
}
