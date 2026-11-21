import Image from "next/image";
import { BUCKET_ART, type BucketArt } from "../lib/bucket-art";
import { HomeIcon } from "./HomeIcons";

export type BucketTile = {
  id: string;
  name: string;
  // 한 줄 설명(선택). 버킷 명세(BKT-02)에서 `description`으로 정한다. 없으면 줄을 그리지 않는다
  description?: string;
  art: BucketArt;
};

// 홈 버킷 카드(07-BRAND §7 "버킷 카드", 2026-11-21): 카드 틀 없이 썸네일 하나.
// 왼쪽 위 책갈피, 이름은 썸네일 안 왼쪽 아래 흰 글자(아래쪽만 완만한 검정 그라데이션), 설명 한 줄은 썸네일 아래.
// 썸네일 색은 앞으로 늘고 사용자 사진도 들어오므로 어떤 이미지에서도 읽히게 한다. 링크 개수·칩·색 번짐은 넣지 않는다
export function BucketTiles({ buckets }: { buckets: BucketTile[] }) {
  return (
    <ul className="flex snap-x gap-3 overflow-x-auto md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
      {buckets.map((bucket) => (
        <li key={bucket.id} className="w-[220px] shrink-0 snap-start md:w-auto">
          <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            <Image
              src={BUCKET_ART[bucket.art]}
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 220px"
              className="object-cover"
            />
            <span
              aria-hidden="true"
              className="kp-bucket-scrim absolute inset-x-0 bottom-0 h-[62%]"
            />
            <span className="absolute top-3 left-3 text-white drop-shadow-sm">
              <HomeIcon name="bookmark" size={18} filled />
            </span>
            <span className="kp-on-image absolute right-3.5 bottom-3 left-3.5 truncate text-base font-bold">
              {bucket.name}
            </span>
          </span>
          {bucket.description && (
            <p className="mt-2 truncate px-0.5 text-[13px] text-muted-foreground">
              {bucket.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
