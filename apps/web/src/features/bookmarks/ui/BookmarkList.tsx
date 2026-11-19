"use client";

import {
  type BookmarkResponse,
  useBookmarksControllerRemove,
  useBookmarksControllerRestore,
} from "@keepio/api-client";
import { useState } from "react";
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
import { RowMenu } from "./RowMenu";

const ERROR_ID = "bookmark-list-error";

const EMPTY: Record<BookmarkStatus, string> = {
  active: "저장한 링크가 없어요.",
  deleted: "휴지통이 비어 있어요.",
};

export type ListView = "list" | "grid";

// FEAT-002 AC-10~13. 내 링크는 ⋯ 메뉴의 [삭제], 휴지통은 [복구]. 성공하면 두 목록만 다시 받는다.
// FEAT-010: 썸네일·표시 제목·도메인·태그. 썸네일이 없으면 활성 목록에서 캡처를 올릴 수 있다.
// LINK-01 시안(FEAT-009 후속): 목록형은 한 판 안에 줄을 나누고, 카드형은 썸네일이 위에 오는 격자
export function BookmarkList({
  status,
  view = "list",
}: {
  status: BookmarkStatus;
  view?: ListView;
}) {
  const pages = useBookmarkPages(status);
  const remove = useBookmarksControllerRemove();
  const restore = useBookmarksControllerRestore();
  const invalidate = useInvalidateBookmarkLists();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function act(id: string) {
    setActionError(null);
    setPendingId(id);
    const r =
      status === "active"
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
    return status === "active" ? (
      <RowMenu
        label={b.displayTitle}
        disabled={pendingId === b.id}
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
        title={b.displayTitle}
        thumbnail={b.thumbnail}
        canUpload={status === "active"}
        onUploaded={() => void invalidate()}
        onError={setActionError}
        variant={view === "list" ? "row" : "card"}
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
              <LinkText bookmark={b} />
              {action(b)}
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
                <LinkText bookmark={b} />
                {action(b)}
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
    </div>
  );
}

function LinkText({ bookmark: b }: { bookmark: BookmarkResponse }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <a
        href={b.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate text-base font-bold tracking-tight hover:underline focus-visible:focus-ring md:text-lg"
      >
        {b.displayTitle}
      </a>
      <p className="truncate text-sm text-muted-foreground">{host(b.url)}</p>
      {b.tags.length > 0 && (
        <ul aria-label="태그" className="mt-1 flex flex-wrap gap-1.5">
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

function host(url: string) {
  return URL.parse(url)?.host ?? url;
}
