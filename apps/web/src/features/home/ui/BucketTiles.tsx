import Image from "next/image";
import { BUCKET_ART, type BucketArt } from "../lib/bucket-art";

export type BucketTile = {
  id: string;
  name: string;
  linkCount: number;
  // "2일 전 업데이트"처럼 서버 시각을 사람이 읽는 말로 바꾼 값(표시용)
  updatedLabel: string;
  art: BucketArt;
};

// 홈 버킷 타일(07-BRAND: 이미지 + 이름, 상자 없음). 상태(공개·AI 연결)는 버킷 상세에서만 보여 준다
export function BucketTiles({ buckets }: { buckets: BucketTile[] }) {
  return (
    <ul className="flex snap-x gap-3 overflow-x-auto md:grid md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-4 md:overflow-visible">
      {buckets.map((bucket) => (
        <li key={bucket.id} className="w-36 shrink-0 snap-start md:w-auto">
          <div className="flex flex-col gap-1">
            <span className="relative block h-26 overflow-hidden rounded-[18px] md:h-30 md:rounded-[20px]">
              <Image
                src={BUCKET_ART[bucket.art]}
                alt=""
                fill
                sizes="(min-width: 768px) 240px, 144px"
                className="object-cover"
              />
            </span>
            <span className="pt-2 text-[15px] font-semibold md:text-[17px]">
              {bucket.name}
            </span>
            <span className="text-caption text-muted-foreground">
              링크 {bucket.linkCount}개 · {bucket.updatedLabel}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
