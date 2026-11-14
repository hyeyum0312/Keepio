"use client";

// 공용 폼 부품(auth·bookmarks). 모양은 07-BRAND 기준(FEAT-007): 입력 12px·높이 48px, 주 버튼 잉크 알약형
import { useState } from "react";

export const FORM_ERROR_ID = "form-error";

const BUTTON_BASE =
  "inline-flex h-12 w-full items-center justify-center gap-2 text-base font-semibold transition-colors focus-visible:focus-ring disabled:cursor-not-allowed";

// 버튼 모양을 링크(<a>)에도 쓰려고 클래스로 내보낸다
export const buttonClass = {
  primary: `${BUTTON_BASE} rounded-full bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground`,
  secondary: `${BUTTON_BASE} rounded-full border border-border bg-muted text-foreground`,
  quiet: `${BUTTON_BASE} rounded-full text-muted-foreground`,
} as const;

// AC-14(FEAT-006): 라벨 연결, 오류가 있으면 입력이 오류 문구를 가리킨다
export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  hasError,
  errorId = FORM_ERROR_ID,
  helpText,
  inputMode,
  autoFocus,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  minLength?: number;
  hasError: boolean;
  // 한 화면에 폼이 여럿이면 오류 영역 id를 나눈다
  errorId?: string;
  // 입력 규칙 미리 안내(판단은 서버)
  helpText?: string;
  inputMode?: "email" | "text" | "url";
  autoFocus?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const id = `field-${name}`;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy =
    [hasError ? errorId : undefined, helpId].filter(Boolean).join(" ") ||
    undefined;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && revealed ? "text" : type}
          required
          autoComplete={autoComplete}
          minLength={minLength}
          inputMode={inputMode}
          autoCapitalize={type === "email" ? "off" : undefined}
          autoFocus={autoFocus}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-xl border bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:focus-ring ${
            hasError ? "border-destructive" : "border-input"
          } ${isPassword ? "pr-16" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={revealed}
            className="absolute top-1 right-1 h-10 min-w-12 rounded-lg px-2 text-sm text-muted-foreground focus-visible:focus-ring"
          >
            {revealed ? "숨기기" : "보기"}
          </button>
        )}
      </div>
      {helpText && (
        <p id={helpId} className="text-caption text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
}

export function FormError({
  message,
  id = FORM_ERROR_ID,
}: {
  message: string | null;
  id?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="text-sm leading-normal break-keep text-destructive"
    >
      {message}
    </p>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="text-sm leading-normal text-muted-foreground">
      {children}
    </p>
  );
}

// AC-13(FEAT-006): 요청 중에는 비활성
export function SubmitButton({
  pending,
  disabled = false,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={buttonClass.primary}
    >
      {children}
    </button>
  );
}

export function fieldValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
