"use client";

import {
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

const ERROR_ID = "bookmark-list-error";

const EMPTY: Record<BookmarkStatus, string> = {
  active: "저장한 링크가 없어요.",
  deleted: "휴지통이 비어 있어요.",
};

// FEAT-002 AC-10~13. 내 링크는 [삭제], 휴지통은 [복구]. 성공하면 두 목록만 다시 받는다
export function BookmarkList({ status }: { status: BookmarkStatus }) {
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
  return (
    <div className="flex flex-col gap-3">
      <FormError message={actionError} id={ERROR_ID} />
      {items.length === 0 ? (
        <Notice>{EMPTY[status]}</Notice>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3">
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate underline"
              >
                {b.url}
              </a>
              <button
                type="button"
                onClick={() => act(b.id)}
                disabled={pendingId === b.id}
                aria-label={`${status === "active" ? "삭제" : "복구"}: ${b.url}`}
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              >
                {status === "active" ? "삭제" : "복구"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {pages.hasNextPage && (
        <button
          type="button"
          onClick={() => pages.fetchNextPage()}
          disabled={pages.isFetchingNextPage}
          className="self-center rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          더 보기
        </button>
      )}
    </div>
  );
}
