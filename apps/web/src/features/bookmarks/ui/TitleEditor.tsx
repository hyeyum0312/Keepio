"use client";

import { useBookmarksControllerUpdate } from "@keepio/api-client";
import { useId, useState } from "react";
import { submit } from "@/shared/lib/server-message";

// FEAT-011 AC-01~03. 링크 한 줄의 제목 자리에서 바로 고친다. Enter·[저장]은 저장, Esc·[취소]는 닫기.
// 비우고 저장하면 사용자 제목을 지운다(서버가 페이지 제목 → 사이트 이름으로 보여 준다).
// 입력칸 상태는 07-BRAND §6: 포커스 잉크·오류 빨강 테두리(바깥 링 대신)
export function TitleEditor({
  bookmarkId,
  initial,
  domain,
  onDone,
}: {
  bookmarkId: string;
  // 처음 채울 제목(사이트 이름으로 보이던 링크는 빈 칸)
  initial: string;
  domain: string;
  onDone: (saved: boolean) => void;
}) {
  const id = useId();
  const update = useBookmarksControllerUpdate();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const r = await submit(
      () =>
        update.mutateAsync({
          id: bookmarkId,
          data: { title: value.trim() ? value : null },
        }),
      (res) => res.status === 200,
    );
    if (r.ok) onDone(true);
    else setError(r.message);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-start md:gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor={`${id}-title`} className="sr-only">
          링크 제목
        </label>
        <input
          id={`${id}-title`}
          autoFocus
          value={value}
          maxLength={200}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void save();
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onDone(false);
            }
          }}
          aria-invalid={!!error || undefined}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
          className={`h-10 w-full rounded-[10px] border bg-surface px-3 text-base font-bold text-foreground outline-none ${
            error
              ? "border-destructive shadow-[inset_0_0_0_1px_var(--destructive)]"
              : "border-input focus:border-focus-ring focus:shadow-[inset_0_0_0_1px_var(--focus-ring)]"
          }`}
        />
        {error ? (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        <p id={`${id}-help`} className="truncate text-sm text-muted-foreground">
          {domain} · Enter 저장 · Esc 취소 · 비우면 페이지 제목으로 돌아가요
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => onDone(false)}
          className="min-h-10 rounded-[10px] bg-muted px-3.5 text-sm font-medium focus-visible:focus-ring"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={update.isPending}
          className="min-h-10 rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:focus-ring disabled:opacity-50"
        >
          저장
        </button>
      </div>
    </div>
  );
}
