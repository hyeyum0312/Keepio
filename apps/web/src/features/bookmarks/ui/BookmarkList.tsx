"use client";

import {
  type BookmarkResponse,
  useBookmarksControllerRemove,
  useBookmarksControllerRestore,
  useBookmarksControllerUploadThumbnail,
} from "@keepio/api-client";
import { useRef, useState } from "react";
import { NETWORK_ERROR_MESSAGE } from "@/shared/lib/network-error";
import { submit } from "@/shared/lib/server-message";
import { FormError, Notice } from "@/shared/ui/FormParts";
import {
  type BookmarkStatus,
  ServerMessageError,
  useBookmarkPages,
  useInvalidateBookmarkLists,
} from "../model/useBookmarkPages";
import { BookmarkThumb } from "./BookmarkThumb";
import { LinkIcon } from "./LinkIcons";
import { RowMenu } from "./RowMenu";
import { TitleEditor } from "./TitleEditor";

const ERROR_ID = "bookmark-list-error";
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const EMPTY: Record<BookmarkStatus, string> = {
  active: "저장한 링크가 없어요.",
  deleted: "휴지통이 비어 있어요.",
};

export type ListView = "list" | "grid";

export type ListSelection = {
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  // 체크박스를 늘 보일지(하나라도 골랐거나 모바일 선택 모드)
  always: boolean;
};

// FEAT-002 AC-10~13. 내 링크는 ⋯ 메뉴(수정·이미지 바꾸기·삭제), 휴지통은 [복구]. 성공하면 두 목록만 다시 받는다.
// FEAT-010: 썸네일·표시 제목·도메인·태그. LINK-01 시안: 목록형은 한 판 안에 줄을 나누고, 카드형은 썸네일이 위에 오는 격자.
// FEAT-011: 제목 수정(줄 안 입력칸)·제목 넣기 안내·이미지 바꾸기(메뉴)·썸네일 안 체크박스(selection이 있을 때)
export function BookmarkList({
  status,
  view = "list",
  selection,
}: {
  status: BookmarkStatus;
  view?: ListView;
  selection?: ListSelection;
}) {
  const pages = useBookmarkPages(status);
  const remove = useBookmarksControllerRemove();
  const restore = useBookmarksControllerRestore();
  const upload = useBookmarksControllerUploadThumbnail();
  const invalidate = useInvalidateBookmarkLists();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; empty: boolean } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const active = status === "active";

  async function act(id: string) {
    setActionError(null);
    setPendingId(id);
    const r = active
      ? await submit(
          () => remove.mutateAsync({ id }),
          (res) => res.status === 204,
        )
      : await submit(
          () => restore.mutateAsync({ id }),
          (res) => res.status === 200,
        );
    setPendingId(null);
    if (r.ok) await invalidate();
    else setActionError(r.message);
  }

  function pickImage(id: string) {
    uploadTarget.current = id;
    fileInput.current?.click();
  }

  async function onFile(file: File | undefined) {
    const id = uploadTarget.current;
    if (fileInput.current) fileInput.current.value = "";
    if (!file || !id) return;
    setActionError(null);
    setUploadingId(id);
    const r = await submit(
      () => upload.mutateAsync({ id, data: { file } }),
      (res) => res.status === 200,
    );
    setUploadingId(null);
    if (r.ok) await invalidate();
    else setActionError(r.message);
  }

  async function finishEdit(id: string, saved: boolean) {
    setEditing(null);
    if (saved) await invalidate();
    // 수정을 마치면 그 링크의 ⋯ 버튼으로 포커스를 돌린다
    requestAnimationFrame(() => document.getElementById(menuId(id))?.focus());
  }

  if (pages.isPending) return <Notice>불러오는 중이에요…</Notice>;
  if (pages.isError) {
    return (
      <FormError
        id={ERROR_ID}
        message={
          pages.error instanceof ServerMessageError
            ? pages.error.message
            : NETWORK_ERROR_MESSAGE
        }
      />
    );
  }

  const items = pages.data.pages.flatMap((p) => p.items);

  function action(b: BookmarkResponse) {
    return active ? (
      <RowMenu
        label={b.displayTitle}
        triggerId={menuId(b.id)}
        disabled={pendingId === b.id || uploadingId === b.id}
        imageLabel={hasImage(b) ? "이미지 바꾸기" : "캡처 올리기"}
        onEdit={() => setEditing({ id: b.id, empty: false })}
        onReplaceImage={() => pickImage(b.id)}
        onDelete={() => act(b.id)}
      />
    ) : (
      <button
        type="button"
        onClick={() => act(b.id)}
        disabled={pendingId === b.id}
        aria-label={`복구: ${b.displayTitle}`}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:focus-ring disabled:opacity-50"
      >
        복구
      </button>
    );
  }

  function thumb(b: BookmarkResponse) {
    return (
      <BookmarkThumb
        bookmarkId={b.id}
        pageUrl={b.url}
        faviconUrl={b.faviconUrl}
        thumbnail={b.thumbnail}
        variant={view === "list" ? "row" : "card"}
        uploading={uploadingId === b.id}
        select={
          active && selection
            ? {
                checked: selection.selected.includes(b.id),
                onChange: (checked) => selection.onToggle(b.id, checked),
                label: `선택: ${b.displayTitle}`,
                always: selection.always,
              }
            : undefined
        }
      />
    );
  }

  function text(b: BookmarkResponse) {
    return editing?.id === b.id ? (
      <TitleEditor
        bookmarkId={b.id}
        initial={
          editing.empty || b.titleSource === "site" ? "" : b.displayTitle
        }
        domain={host(b.url)}
        onDone={(saved) => void finishEdit(b.id, saved)}
      />
    ) : (
      <LinkText
        bookmark={b}
        onAddTitle={
          active && b.titleSource === "site"
            ? () => setEditing({ id: b.id, empty: true })
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <FormError message={actionError} id={ERROR_ID} />
      {items.length === 0 ? (
        <Notice>{EMPTY[status]}</Notice>
      ) : view === "list" ? (
        <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-4 px-3 py-3 md:gap-5 md:px-4"
            >
              {thumb(b)}
              {text(b)}
              {editing?.id !== b.id && action(b)}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface"
            >
              {thumb(b)}
              <div className="flex items-start gap-1 p-3 pr-1 md:p-4 md:pr-2">
                {text(b)}
                {editing?.id !== b.id && action(b)}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pages.hasNextPage && (
        <button
          type="button"
          onClick={() => pages.fetchNextPage()}
          disabled={pages.isFetchingNextPage}
          className="inline-flex min-h-11 items-center self-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted focus-visible:focus-ring disabled:opacity-50"
        >
          더 보기
        </button>
      )}
      {active && (
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          hidden
          aria-label="썸네일 이미지 파일"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      )}
    </div>
  );
}

function LinkText({
  bookmark: b,
  onAddTitle,
}: {
  bookmark: BookmarkResponse;
  // 제목을 못 받아 사이트 이름으로 보이는 링크(FEAT-011 AC-04)
  onAddTitle?: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex min-w-0 items-baseline gap-2">
        <a
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-2xl min-w-0 truncate text-base font-bold tracking-tight hover:underline focus-visible:focus-ring"
        >
          {b.displayTitle}
        </a>
        {onAddTitle && (
          <button
            type="button"
            onClick={onAddTitle}
            aria-label={`제목 넣기: ${b.displayTitle}`}
            className="shrink-0 rounded-md text-[13px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:focus-ring"
          >
            제목 넣기
          </button>
        )}
      </div>
      <p className="truncate text-sm text-muted-foreground">{host(b.url)}</p>
      {/* 분류 줄(2026-11-22): 카테고리 → 태그 순. 모양으로 종류를 구분한다.
          미분류면 카테고리 칩을 그리지 않고, 둘 다 없으면 줄 자체를 그리지 않는다.
          버킷 칩은 버킷 기능과 함께 붙인다(screens/LINK-01) */}
      {(b.category || b.tags.length > 0) && (
        <ul
          aria-label="분류"
          className="mt-1.5 flex flex-wrap items-center gap-1.5"
        >
          {b.category && (
            <li className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-caption font-medium text-foreground">
              <LinkIcon name="folder" size={13} />
              {b.category.name}
            </li>
          )}
          {b.tags.map((t) => (
            <li
              key={t.id}
              className="rounded-full bg-muted px-3 py-1 text-caption font-medium"
            >
              #{t.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function menuId(id: string) {
  return `row-menu-${id}`;
}

function hasImage(b: BookmarkResponse) {
  return b.thumbnail.status === "ready" || !!b.thumbnail.sourceUrl;
}

function host(url: string) {
  return URL.parse(url)?.host ?? url;
}
