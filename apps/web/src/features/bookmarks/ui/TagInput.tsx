"use client";

import { useState } from "react";

// FEAT-010 AC-01·02. Enter·쉼표로 칩을 만들고, 빈 입력에서 Backspace로 마지막 칩을 지운다.
// 개수·길이 판정은 서버가 한다(ADR-009). 여기서는 화면에서 같은 이름(대소문자·공백 차이)만 하나로 보인다
export function TagInput({
  value,
  onChange,
  draft,
  onDraftChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  // 저장 버튼을 누를 때 입력 중인 글자도 태그로 넣기 위해 부모가 갖는다
  draft: string;
  onDraftChange: (draft: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  function commit(raw: string) {
    const next = addTag(value, raw);
    if (next !== value) onChange(next);
    onDraftChange("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // 한글 조합 중 Enter는 글자 확정이라 태그로 만들지 않는다
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim()) commit(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="field-tags" className="text-sm font-semibold">
        태그 <span className="font-normal text-muted-foreground">(선택)</span>
      </label>
      <div
        className={`flex min-h-12 flex-wrap items-center gap-2 rounded-xl border bg-surface px-3 py-2 ${
          focused ? "border-foreground" : "border-border"
        }`}
      >
        <ul aria-label="추가한 태그" className="contents">
          {value.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                aria-label={`태그 ${tag} 삭제`}
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface focus-visible:focus-ring"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
        <input
          id="field-tags"
          type="text"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            // 붙여넣기로 쉼표가 들어오면 앞부분을 태그로 만든다
            if (v.includes(",")) {
              const parts = v.split(",");
              let next = value;
              for (const part of parts.slice(0, -1)) next = addTag(next, part);
              if (next !== value) onChange(next);
              onDraftChange(parts.at(-1) ?? "");
            } else onDraftChange(v);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-describedby="field-tags-help"
          placeholder={value.length === 0 ? "모션, 랜딩" : undefined}
          className="min-w-24 flex-1 bg-transparent py-1 outline-none"
        />
      </div>
      <p id="field-tags-help" className="text-caption text-muted-foreground">
        Enter나 쉼표로 추가 · 최대 10개, 한 개에 30자까지
      </p>
    </div>
  );
}

// 앞뒤 공백·연속 공백을 정리하고, 같은 이름(대소문자 무시)이 있으면 그대로 둔다
export function addTag(tags: string[], raw: string): string[] {
  const name = raw.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!name) return tags;
  const key = name.toLowerCase();
  if (tags.some((t) => t.toLowerCase() === key)) return tags;
  return [...tags, name];
}
