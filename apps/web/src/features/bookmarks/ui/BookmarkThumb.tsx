"use client";

import {
  apiUrl,
  type BookmarkThumbnailResponse,
  useBookmarksControllerUploadThumbnail,
} from "@keepio/api-client";
import Image from "next/image";
import { useRef, useState } from "react";
import { fallbackArtFor } from "@/shared/lib/fallback-art";
import { submit } from "@/shared/lib/server-message";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
// row: 5:3 모바일 120×72, PC 160×96(LINK-01 시안. 64×48은 인스타 썸네일 내용을 알아보기 어려웠다)
// card: 카드 폭을 채우는 16:10
const BOXES = {
  row: "h-18 w-30 shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-40",
  card: "aspect-16/10 w-full overflow-hidden bg-muted",
} as const;
export type ThumbVariant = keyof typeof BOXES;

// FEAT-010 AC-04~06. ready는 이미지, pending은 회색 상자, failed는 아트워크 + 캡처 올리기(활성 목록만).
// 이미지를 불러오지 못하면(만료·삭제 등) 링크 ID로 정한 아트워크를 대신 보여 준다(같은 링크는 늘 같은 그림)
export function BookmarkThumb({
  bookmarkId,
  title,
  thumbnail,
  canUpload,
  onUploaded,
  onError,
  variant = "row",
}: {
  bookmarkId: string;
  title: string;
  thumbnail: BookmarkThumbnailResponse;
  canUpload: boolean;
  onUploaded: () => void;
  onError: (message: string) => void;
  variant?: ThumbVariant;
}) {
  const BOX = BOXES[variant];
  const upload = useBookmarksControllerUploadThumbnail();
  const input = useRef<HTMLInputElement>(null);
  const [broken, setBroken] = useState<string | null>(null);
  const art = fallbackArtFor(bookmarkId);

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

  if (
    thumbnail.status === "ready" &&
    thumbnail.url &&
    broken !== thumbnail.url
  ) {
    const url = thumbnail.url;
    const sizes =
      variant === "row" ? "160px" : "(min-width: 768px) 320px, 50vw";
    return (
      // 비율이 제각각(유튜브 16:9, 인스타 1:1·4:5)이라 자르지 않고 상자 안에 다 보이게 한다(object-contain).
      // 남는 자리는 같은 이미지를 흐리게 깔아 채운다(같은 주소라 추가 요청 없음)
      <div className={`${BOX} relative`}>
        {/* 서명 주소라 Next 이미지 최적화(캐시 키)를 거치지 않는다 */}
        <Image
          src={apiUrl(url)}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          unoptimized
          className="scale-125 object-cover opacity-60 blur-lg"
        />
        <Image
          src={apiUrl(url)}
          onError={() => setBroken(url)}
          alt=""
          fill
          sizes={sizes}
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
  const artImage = (
    <Image
      src={art}
      alt=""
      fill
      sizes={variant === "row" ? "160px" : "(min-width: 768px) 320px, 50vw"}
      className="object-cover"
    />
  );
  if (!canUpload || thumbnail.status === "ready") {
    return (
      <div aria-hidden="true" className={`${BOX} relative`}>
        {artImage}
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={upload.isPending}
        aria-label={`캡처 올리기: ${title}`}
        className={`${BOX} group relative focus-visible:focus-ring disabled:opacity-50`}
      >
        {artImage}
        <span className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-surface/90 py-1 text-caption font-medium text-foreground group-hover:bg-surface">
          {upload.isPending ? "올리는 중" : "캡처 올리기"}
        </span>
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
