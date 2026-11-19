import Image from "next/image";
import { BUCKET_ART, type BucketArt } from "../lib/bucket-art";
import { HomeIcon } from "./HomeIcons";

export type BucketTile = {
  id: string;
  name: string;
  linkCount: number;
  // "2일 전 업데이트"처럼 서버 시각을 사람이 읽는 말로 바꾼 값(표시용)
  updatedLabel: string;
  art: BucketArt;
};

// 홈 버킷 타일(2026-11-19 시안): 아트워크 + 왼쪽 위 책갈피 + 이름·더보기 + 링크 수·업데이트
export function BucketTiles({ buckets }: { buckets: BucketTile[] }) {
  return (
    <ul className="flex snap-x gap-3 overflow-x-auto md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
      {buckets.map((bucket) => (
        <li key={bucket.id} className="w-40 shrink-0 snap-start md:w-auto">
          <div className="flex flex-col gap-1">
            <span className="relative block aspect-[16/10] overflow-hidden rounded-[20px]">
              <Image
                src={BUCKET_ART[bucket.art]}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 160px"
                className="object-cover"
              />
              <span className="absolute top-3 left-3 text-white drop-shadow-sm">
                <HomeIcon name="bookmark" size={18} filled />
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 pt-2 pl-2">
              <span className="truncate text-[15px] font-bold md:text-base">
                {bucket.name}
              </span>
              <button
                type="button"
                aria-label={`${bucket.name} 더보기`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:focus-ring"
              >
                <HomeIcon name="more" />
              </button>
            </span>
            <span className="truncate pl-2 text-caption text-muted-foreground">
              {bucket.linkCount}개 링크 · {bucket.updatedLabel}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
