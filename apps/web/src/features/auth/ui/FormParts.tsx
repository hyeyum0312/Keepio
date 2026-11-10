// 기능 위주 최소 UI(FEAT-006, D-09 전). 디자인 시스템이 생기면 이 파일의 마크업·클래스만 바꾼다

export const FORM_ERROR_ID = "form-error";

export function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  );
}

// AC-14: 라벨 연결, 오류가 있으면 입력이 오류 문구를 가리킨다
export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  hasError,
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  minLength?: number;
  hasError: boolean;
}) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? FORM_ERROR_ID : undefined}
        className="rounded border px-3 py-2"
      />
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p id={FORM_ERROR_ID} role="alert" className="text-sm">
      {message}
    </p>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="text-sm">
      {children}
    </p>
  );
}

// AC-13: 요청 중에는 비활성
export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="rounded border px-3 py-2 font-medium disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function fieldValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
