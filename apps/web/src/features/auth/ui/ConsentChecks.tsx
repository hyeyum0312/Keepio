// FEAT-007 AC-06·07, AUTH-02 결정 2·3. 필수 동의 3개. 화면에서만 제출을 막고 서버에 기록하지 않는다(공개 전 후속 작업).
// 약관 본문(INFO-01·02)은 아직 없어 [보기]는 예정 경로로 연결한다
const ITEMS = [
  { key: "age", label: "만 14세 이상이에요" },
  { key: "terms", label: "이용약관 동의", href: "/terms" },
  { key: "privacy", label: "개인정보 수집·이용 동의", href: "/privacy" },
] as const;

export type ConsentKey = (typeof ITEMS)[number]["key"];
export type Consents = Record<ConsentKey, boolean>;
export const NO_CONSENTS: Consents = {
  age: false,
  terms: false,
  privacy: false,
};

export function allConsented(c: Consents) {
  return ITEMS.every(({ key }) => c[key]);
}

export function ConsentChecks({
  value,
  onChange,
}: {
  value: Consents;
  onChange: (next: Consents) => void;
}) {
  return (
    <fieldset className="flex flex-col py-1">
      <legend className="sr-only">필수 동의</legend>
      {ITEMS.map((item) => (
        <div
          key={item.key}
          className="flex min-h-11 items-center justify-between gap-2"
        >
          <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name={`consent-${item.key}`}
              checked={value[item.key]}
              onChange={(e) =>
                onChange({ ...value, [item.key]: e.target.checked })
              }
              className="size-5 accent-primary focus-visible:focus-ring"
            />
            <span>
              {item.label} <span className="text-muted-foreground">(필수)</span>
            </span>
          </label>
          {"href" in item && (
            <a
              href={item.href}
              aria-label={`${item.label.replace(" 동의", "")} 보기`}
              className="rounded px-1 py-2 text-sm text-muted-foreground underline focus-visible:focus-ring"
            >
              보기
            </a>
          )}
        </div>
      ))}
    </fieldset>
  );
}
