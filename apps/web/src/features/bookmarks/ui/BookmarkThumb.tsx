"use client";

import type { BookmarkThumbnailResponse } from "@keepio/api-client";
import Image from "next/image";
import { useState } from "react";
import { fallbackArtFor } from "@/shared/lib/fallback-art";
import { thumbnailSources } from "@/shared/lib/thumbnail-sources";
import { FaviconTile } from "@/shared/ui/FaviconTile";

// row: 5:3 모바일 120×72, PC 160×96(LINK-01 시안. 64×48은 인스타 썸네일 내용을 알아보기 어려웠다)
// card: 카드 폭을 채우는 16:10
const BOXES = {
  row: "h-18 w-30 shrink-0 overflow-hidden rounded-xl bg-muted md:h-24 md:w-40",
  card: "aspect-16/10 w-full overflow-hidden bg-muted",
} as const;
export type ThumbVariant = keyof typeof BOXES;

export type ThumbSelect = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // 체크박스 이름(화면 읽기)
  label: string;
  // true: 늘 보인다(하나라도 골랐거나 모바일 선택 모드). false: PC에서 마우스를 올릴 때만
  always: boolean;
};

// FEAT-010 AC-04·05·11·15. ready는 이미지, pending은 회색 상자, failed는 아트워크(+ 파비콘).
// 보관 파일을 못 불러오면 링크 페이지의 원본 이미지를, 그것도 안 되면 링크 ID로 정한 아트워크를 보여 준다.
// FEAT-011 AC-05·06: 이미지 바꾸기는 ⋯ 메뉴로 옮겼고, 썸네일을 누르면 링크를 고른다(왼쪽 위 체크박스)
export function BookmarkThumb({
  bookmarkId,
  pageUrl,
  faviconUrl,
  thumbnail,
  variant = "row",
  uploading = false,
  select,
}: {
  bookmarkId: string;
  // 파비콘 대체(사이트 주소/favicon.ico)를 만들 링크 주소
  pageUrl: string;
  faviconUrl?: string | null;
  thumbnail: BookmarkThumbnailResponse;
  variant?: ThumbVariant;
  uploading?: boolean;
  select?: ThumbSelect;
}) {
  const BOX = BOXES[variant];
  const [broken, setBroken] = useState<string[]>([]);
  const src = thumbnailSources(thumbnail).find((s) => !broken.includes(s));
  const sizes = variant === "row" ? "160px" : "(min-width: 768px) 320px, 50vw";
  const pending = !src && thumbnail.status === "pending";

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
  } else if (pending) {
    content = <span className="sr-only">썸네일 가져오는 중</span>;
  } else {
    content = (
      <>
        <Image
          src={fallbackArtFor(bookmarkId)}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
        />
        <FaviconTile
          faviconUrl={faviconUrl}
          pageUrl={pageUrl}
          size={variant === "row" ? "sm" : "md"}
        />
      </>
    );
  }
  const boxClass = `${BOX} relative ${pending ? "motion-safe:animate-pulse" : ""}`;
  const status = uploading ? (
    <span
      role="status"
      className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-surface/90 py-1 text-center text-caption font-medium text-foreground"
    >
      올리는 중
    </span>
  ) : null;

  if (!select) {
    return (
      <div
        aria-hidden={(!pending && !uploading) || undefined}
        className={boxClass}
      >
        {content}
        {status}
      </div>
    );
  }
  // 썸네일 어디를 눌러도 고른다(라벨). 체크박스는 왼쪽 위, 누르는 영역 44px
  return (
    <label className={`${boxClass} group/thumb cursor-pointer`}>
      {content}
      {status}
      <span className="absolute top-0 left-0 z-10 flex size-11 items-center justify-center">
        <input
          type="checkbox"
          checked={select.checked}
          onChange={(e) => select.onChange(e.target.checked)}
          aria-label={select.label}
          className="peer absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={`kp-thumb-check size-[22px] rounded-[7px] transition-opacity peer-focus-visible:focus-ring ${
            select.always || select.checked
              ? "opacity-100"
              : "opacity-0 group-hover/thumb:opacity-100 peer-focus-visible:opacity-100 [@media(hover:none)]:hidden"
          }`}
        />
      </span>
    </label>
  );
}
