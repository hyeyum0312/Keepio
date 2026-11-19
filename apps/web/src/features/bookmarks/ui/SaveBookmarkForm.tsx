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
import { addTag, TagInput } from "./TagInput";

const ERROR_ID = "save-bookmark-error";

type Failure = { message: string; deletedId?: string };

// FEAT-002 AC-09. 저장하면 목록 맨 위에. 삭제했던 링크면(409 BOOKMARK_DELETED) 서버 문구 + [복구].
// FEAT-010 AC-01: 제목(선택)과 태그(선택)를 함께 보낸다. 입력 중인 태그 글자도 저장할 때 태그로 넣는다
export function SaveBookmarkForm() {
  const save = useBookmarksControllerSave();
  const restore = useBookmarksControllerRestore();
  const invalidate = useInvalidateBookmarkLists();
  const [failure, setFailure] = useState<Failure | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

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
    } else {
      setFailure({ message: r.message });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="링크 주소"
            name="url"
            type="text"
            autoComplete="url"
            hasError={!!failure}
            errorId={ERROR_ID}
          />
        </div>
        <SubmitButton pending={save.isPending}>저장</SubmitButton>
      </div>
      <TextField
        label="제목 (선택)"
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
