"use client";

import {
  type BookmarkThumbnailResponse,
  useBookmarksControllerUploadThumbnail,
} from "@keepio/api-client";
import Image from "next/image";
import { useRef, useState } from "react";
import { fallbackArtFor } from "@/shared/lib/fallback-art";
import { submit } from "@/shared/lib/server-message";
import { thumbnailSources } from "@/shared/lib/thumbnail-sources";
import { FaviconTile } from "@/shared/ui/FaviconTile";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
// row: 5:3 모바일 120×72, PC 160×96(LINK-01 시안. 64×48은 인스타 썸네일 내용을 알아보기 어려웠다)
// card: 카드 폭을 채우는 16:10
const BOXES = {
  row: "h-18 w-30 shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-40",
  card: "aspect-16/10 w-full overflow-hidden bg-muted",
} as const;
export type ThumbVariant = keyof typeof BOXES;

// FEAT-010 AC-04~06. ready는 이미지, pending은 회색 상자, failed는 아트워크. 활성 목록에서는 어느 상태든 눌러 이미지를 올리거나 바꾼다.
// 보관 파일을 못 불러오면(만료·삭제·서버 디스크 초기화) 링크 페이지의 원본 이미지(AC-11)를, 그것도 안 되면
// 링크 ID로 정한 아트워크를 보여 준다(같은 링크는 늘 같은 그림). 아트워크 가운데에는 사이트 파비콘을 올린다(AC-15)
export function BookmarkThumb({
  bookmarkId,
  title,
  pageUrl,
  faviconUrl,
  thumbnail,
  canUpload,
  onUploaded,
  onError,
  variant = "row",
}: {
  bookmarkId: string;
  title: string;
  // 파비콘 대체(사이트 주소/favicon.ico)를 만들 링크 주소
  pageUrl: string;
  faviconUrl?: string | null;
  thumbnail: BookmarkThumbnailResponse;
  canUpload: boolean;
  onUploaded: () => void;
  onError: (message: string) => void;
  variant?: ThumbVariant;
}) {
  const BOX = BOXES[variant];
  const upload = useBookmarksControllerUploadThumbnail();
  const input = useRef<HTMLInputElement>(null);
  const [broken, setBroken] = useState<string[]>([]);
  const art = fallbackArtFor(bookmarkId);
  const src = thumbnailSources(thumbnail).find((s) => !broken.includes(s));

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

  const sizes = variant === "row" ? "160px" : "(min-width: 768px) 320px, 50vw";
  let content: React.ReactNode;
  if (src) {
    // 비율이 제각각(유튜브 16:9, 인스타 1:1·4:5)이라 자르지 않고 상자 안에 다 보이게 한다(object-contain).
    // 남는 자리는 같은 이미지를 흐리게 깔아 채운다(같은 주소라 추가 요청 없음).
    // 서명 주소·다른 사이트 주소라 Next 이미지 최적화(캐시 키)를 거치지 않는다. 원본 사이트에 지금 보는 주소를 넘기지 않는다
    content = (
      <>
        <Image
          key={`bg-${src}`}
          src={src}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          unoptimized
          referrerPolicy="no-referrer"
          className="scale-125 object-cover opacity-60 blur-lg"
        />
        <Image
          key={src}
          src={src}
          onError={() => setBroken((b) => [...b, src])}
          alt=""
          fill
          sizes={sizes}
          unoptimized
          referrerPolicy="no-referrer"
          className="object-contain"
        />
      </>
    );
  } else if (thumbnail.status === "pending") {
    content = <span className="sr-only">썸네일 가져오는 중</span>;
  } else {
    content = (
      <>
        <Image src={art} alt="" fill sizes={sizes} className="object-cover" />
        <FaviconTile
          faviconUrl={faviconUrl}
          pageUrl={pageUrl}
          size={variant === "row" ? "sm" : "md"}
        />
      </>
    );
  }
  const boxClass = `${BOX} relative ${!src && thumbnail.status === "pending" ? "motion-safe:animate-pulse" : ""}`;

  // 휴지통 등 올릴 수 없는 곳은 그림만
  if (!canUpload) {
    return (
      <div
        aria-hidden={(!src && thumbnail.status !== "pending") || undefined}
        className={boxClass}
      >
        {content}
      </div>
    );
  }
  // 이미지가 이미 있어도 사용자가 바꿀 수 있다(2026-11-21 사용자 결정). 서버는 올린 이미지로 바꾸고 이전 파일을 지운다(AC-06)
  const label = src ? "이미지 바꾸기" : "캡처 올리기";
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={upload.isPending}
        aria-label={`${label}: ${title}${!src && thumbnail.status === "pending" ? " (썸네일 가져오는 중)" : ""}`}
        className={`${boxClass} group focus-visible:focus-ring disabled:opacity-50`}
      >
        {content}
        {/* 안내 글자는 마우스를 올리거나 키보드로 고를 때만 보인다(사용자 결정 2026-11-21). 올리는 중이거나
            마우스가 없는 기기(터치)는 늘 보인다. 버튼 이름(aria-label)은 늘 읽힌다 */}
        <span
          className={`absolute inset-x-1.5 bottom-1.5 rounded-lg bg-surface/90 py-1 text-caption font-medium text-foreground transition-opacity group-hover:bg-surface ${
            upload.isPending
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          }`}
        >
          {upload.isPending ? "올리는 중" : label}
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
