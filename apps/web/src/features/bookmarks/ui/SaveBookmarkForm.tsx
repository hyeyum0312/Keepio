"use client";

import {
  useBookmarksControllerRestore,
  useBookmarksControllerSave,
} from "@keepio/api-client";
import { useState } from "react";
import { submit } from "@/shared/lib/server-message";
import {
  fieldValue,
  FormError,
  SubmitButton,
  TextField,
} from "@/shared/ui/FormParts";
import { useInvalidateBookmarkLists } from "../model/useBookmarkPages";
import { LinkIcon } from "./LinkIcons";
import { addTag, TagInput } from "./TagInput";

const ERROR_ID = "save-bookmark-error";
const EXTRA_ID = "save-bookmark-extra";

type Failure = { message: string; deletedId?: string };

// FEAT-002 AC-09. 저장하면 목록 맨 위에. 삭제했던 링크면(409 BOOKMARK_DELETED) 서버 문구 + [복구].
// FEAT-010 AC-01: 제목(선택)과 태그(선택)를 함께 보낸다. 입력 중인 태그 글자도 저장할 때 태그로 넣는다.
// LINK-01 시안: 제목·태그는 "추가 정보 입력하기"로 펼친다. 접어도 입력한 값은 남고 함께 저장된다.
// onSaved: 저장(또는 복구)에 성공한 뒤 부르는 콜백(예: 모바일 시트 닫기)
export function SaveBookmarkForm({ onSaved }: { onSaved?: () => void } = {}) {
  const save = useBookmarksControllerSave();
  const restore = useBookmarksControllerRestore();
  const invalidate = useInvalidateBookmarkLists();
  const [failure, setFailure] = useState<Failure | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [extraOpen, setExtraOpen] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFailure(null);
    const data = new FormData(form);
    const title = fieldValue(data, "title").trim();
    const allTags = addTag(tags, tagDraft);
    setTags(allTags);
    setTagDraft("");
    const r = await submit(
      () =>
        save.mutateAsync({
          data: {
            url: fieldValue(data, "url"),
            ...(title ? { title } : {}),
            ...(allTags.length > 0 ? { tags: allTags } : {}),
          },
        }),
      (res) => res.status === 201 || res.status === 200,
    );
    if (r.ok) {
      form.reset();
      setTags([]);
      await invalidate();
      onSaved?.();
      return;
    }
    // 복구 대상 ID는 서버가 준다(D-01). 분기는 code로만(ADR-009)
    const deletedId =
      r.res?.status === 409 && r.res.data.code === "BOOKMARK_DELETED"
        ? r.res.data.bookmarkId
        : undefined;
    setFailure({ message: r.message, deletedId });
  }

  async function onRestore(id: string) {
    const r = await submit(
      () => restore.mutateAsync({ id }),
      (res) => res.status === 200,
    );
    if (r.ok) {
      setFailure(null);
      await invalidate();
      onSaved?.();
    } else {
      setFailure({ message: r.message });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="field-url" className="sr-only">
            링크 주소
          </label>
          <span className="pointer-events-none absolute top-1/2 left-0.5 -translate-y-1/2 text-muted-foreground">
            <LinkIcon name="link" size={20} />
          </span>
          <input
            id="field-url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            required
            placeholder="링크를 붙여넣으세요 (https://)"
            aria-invalid={!!failure || undefined}
            aria-describedby={failure ? ERROR_ID : undefined}
            className={`h-12 w-full kp-field pr-4 pl-10 text-base text-foreground placeholder:text-muted-foreground md:text-sm ${
              failure ? "border-destructive" : ""
            }`}
          />
        </div>
        {/* 링크 입력칸이 폭을 차지하도록 버튼은 내용 폭(기본 폭 100%가 입력칸을 찌그러뜨렸다) */}
        <SubmitButton
          pending={save.isPending}
          className="w-auto! shrink-0 px-5 md:px-7 md:text-sm"
        >
          저장
        </SubmitButton>
      </div>
      <button
        type="button"
        aria-expanded={extraOpen}
        aria-controls={EXTRA_ID}
        onClick={() => setExtraOpen((v) => !v)}
        className="-my-2 inline-flex min-h-11 items-center gap-1 self-start rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground focus-visible:focus-ring"
      >
        추가 정보 입력하기 (선택)
        <span
          className={`transition-transform ${extraOpen ? "rotate-180" : ""}`}
        >
          <LinkIcon name="chevron" size={14} />
        </span>
      </button>
      {/* 접어도 DOM에 남겨 입력값을 지킨다(hidden이라 화면·보조기기에서는 빠진다) */}
      <div id={EXTRA_ID} hidden={!extraOpen} className="flex flex-col gap-3">
        <TextField
          label="제목 (선택)"
          compact
          name="title"
          hasError={false}
          helpText="비워 두면 링크의 제목을 써요"
        />
        <TagInput
          value={tags}
          onChange={setTags}
          draft={tagDraft}
          onDraftChange={setTagDraft}
        />
      </div>
      <FormError message={failure?.message ?? null} id={ERROR_ID} />
      {failure?.deletedId && (
        <button
          type="button"
          onClick={() => onRestore(failure.deletedId!)}
          disabled={restore.isPending}
          className="self-start rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          복구
        </button>
      )}
    </form>
  );
}
