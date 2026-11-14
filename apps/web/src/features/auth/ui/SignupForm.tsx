"use client";

import {
  useAuthControllerResendVerification,
  useAuthControllerSignup,
} from "@keepio/api-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { submit } from "@/shared/lib/server-message";
import {
  buttonClass,
  fieldValue,
  FormError,
  Notice,
  SubmitButton,
  TextField,
} from "@/shared/ui/FormParts";
import { AuthStage, Divider } from "./AuthStage";
import { BackLink } from "./BackLink";
import {
  allConsented,
  ConsentChecks,
  type Consents,
  NO_CONSENTS,
} from "./ConsentChecks";

// 이메일 회원가입(AUTH-02, FEAT-007 AC-06~09). 서버는 이미 가입된 이메일에도 같은 202를 준다(FEAT-003 AC-03).
// 소셜 가입은 시작 화면(/login)으로 일원화
export function SignupForm() {
  const signup = useAuthControllerSignup();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [consents, setConsents] = useState<Consents>(NO_CONSENTS);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allConsented(consents)) return;
    const form = new FormData(event.currentTarget);
    const email = fieldValue(form, "email");
    setError(null);
    const result = await submit(
      () =>
        signup.mutateAsync({
          data: { email, password: fieldValue(form, "password") },
        }),
      (res) => res.status === 202,
    );
    if (result.ok) setSentTo(email);
    else setError(result.message);
  }

  if (sentTo !== null) return <MailSent email={sentTo} />;

  return (
    <AuthStage title="이메일로 회원가입" compact>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 md:gap-3"
      >
        <BackLink href="/login">카카오·Google로 시작하기</BackLink>
        <TextField
          label="이메일"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          hasError={!!error}
        />
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          helpText="8자 이상으로 입력해 주세요."
          hasError={!!error}
        />
        <Divider />
        <ConsentChecks value={consents} onChange={setConsents} />
        <FormError message={error} />
        <SubmitButton
          pending={signup.isPending}
          disabled={!allConsented(consents)}
        >
          가입하기
        </SubmitButton>
      </form>
      <Divider />
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link
          href="/login"
          className="font-semibold text-foreground underline underline-offset-4 focus-visible:focus-ring"
        >
          로그인
        </Link>
      </p>
    </AuthStage>
  );
}

const RESEND_WAIT_SECONDS = 60;

// FEAT-007 AC-08. 재발송은 60초 대기(화면 규칙). 서버 제한(시간당 3통)과 별개로 서버 응답이 최종
function MailSent({ email }: { email: string }) {
  const resend = useAuthControllerResendVerification();
  const [wait, setWait] = useState(RESEND_WAIT_SECONDS);
  const [result, setResult] = useState<
    { ok: true } | { ok: false; message: string } | null
  >(null);

  // 1초마다 줄이고, 0이 되거나 화면을 떠나면 타이머를 멈춘다
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  async function onResend() {
    setResult(null);
    const r = await submit(
      () => resend.mutateAsync({ data: { email } }),
      (res) => res.status === 202,
    );
    setResult(r.ok ? { ok: true } : { ok: false, message: r.message });
    if (r.ok) setWait(RESEND_WAIT_SECONDS);
  }

  return (
    <AuthStage title="인증 메일을 보냈어요" compact>
      <p
        role="status"
        className="text-base leading-relaxed break-keep text-muted-foreground"
      >
        <strong className="font-semibold text-foreground">{email}</strong>
        으로 인증 메일을 보냈어요. 메일의 링크를 눌러 주세요. 링크는 24시간 동안
        유효해요.
      </p>
      <p className="rounded-2xl bg-muted p-4 text-sm">
        인증 전에도 바로 사용할 수 있어요.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/login?method=email" className={buttonClass.primary}>
          로그인하러 가기
        </Link>
        <button
          type="button"
          onClick={onResend}
          disabled={wait > 0 || resend.isPending}
          className={`${buttonClass.secondary} disabled:bg-transparent disabled:text-muted-foreground`}
        >
          {wait > 0 ? `메일 다시 보내기 (${wait}초)` : "메일 다시 보내기"}
        </button>
        {result?.ok && <Notice>새 인증 메일을 보냈어요.</Notice>}
        {result && !result.ok && <FormError message={result.message} />}
        <p className="text-center text-caption text-muted-foreground">
          메일이 안 오면 스팸함을 확인해 주세요.
        </p>
      </div>
    </AuthStage>
  );
}
