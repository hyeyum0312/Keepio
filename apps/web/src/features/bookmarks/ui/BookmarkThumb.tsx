"use client";

import {
  apiUrl,
  type BookmarkThumbnailResponse,
  useBookmarksControllerUploadThumbnail,
} from "@keepio/api-client";
import Image from "next/image";
import { useRef } from "react";
import { submit } from "@/shared/lib/server-message";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const BOX = "relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-muted";

// FEAT-010 AC-04~06. ready는 이미지, pending은 회색 상자, failed는 빈 상자 + 캡처 올리기(활성 목록만)
export function BookmarkThumb({
  bookmarkId,
  title,
  thumbnail,
  canUpload,
  onUploaded,
  onError,
}: {
  bookmarkId: string;
  title: string;
  thumbnail: BookmarkThumbnailResponse;
  canUpload: boolean;
  onUploaded: () => void;
  onError: (message: string) => void;
}) {
  const upload = useBookmarksControllerUploadThumbnail();
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const r = await submit(
      () => upload.mutateAsync({ id: bookmarkId, data: { file } }),
      (res) => res.status === 200,
    );
    if (input.current) input.current.value = "";
    if (r.ok) onUploaded();
    else onError(r.message);
  }

  if (thumbnail.status === "ready" && thumbnail.url) {
    return (
      <div className={BOX}>
        {/* 서명 주소라 Next 이미지 최적화(캐시 키)를 거치지 않는다. 자르지 않고 다 보이게,
            남는 자리는 같은 이미지를 흐리게 채운다(LINK-01 시안) */}
        <Image
          src={apiUrl(thumbnail.url)}
          alt=""
          aria-hidden="true"
          fill
          unoptimized
          className="scale-125 object-cover opacity-60 blur-md"
        />
        <Image
          src={apiUrl(thumbnail.url)}
          alt=""
          fill
          unoptimized
          className="object-contain"
        />
      </div>
    );
  }
  if (thumbnail.status === "pending") {
    return (
      <div className={`${BOX} motion-safe:animate-pulse`}>
        <span className="sr-only">썸네일 가져오는 중</span>
      </div>
    );
  }
  if (!canUpload) return <div aria-hidden="true" className={BOX} />;
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={upload.isPending}
        aria-label={`캡처 올리기: ${title}`}
        className={`${BOX} flex items-center justify-center border border-dashed border-border text-caption text-muted-foreground hover:border-foreground focus-visible:focus-ring disabled:opacity-50`}
      >
        {upload.isPending ? "올리는 중" : "캡처 올리기"}
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </>
  );
}
