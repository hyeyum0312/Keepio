"use client";

import Image from "next/image";
import { useState } from "react";
import { faviconSources } from "@/shared/lib/favicon-sources";

const SIZES = {
  sm: { tile: "size-8 rounded-lg", icon: 18 },
  md: { tile: "size-10 rounded-xl", icon: 24 },
} as const;

// FEAT-010 AC-15. 보여 줄 썸네일이 없을 때 아트워크 가운데에 올리는 사이트 아이콘(흰 둥근 타일).
// 불러올 때까지는 그리지 않고, 모든 주소를 못 불러오면 아무것도 그리지 않는다(아트워크만).
// 원본 사이트에 지금 보는 주소를 넘기지 않는다(no-referrer). 장식이라 aria-hidden
export function FaviconTile({
  faviconUrl,
  pageUrl,
  size = "md",
}: {
  faviconUrl?: string | null;
  pageUrl: string;
  size?: keyof typeof SIZES;
}) {
  const [broken, setBroken] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<string | null>(null);
  const src = faviconSources(faviconUrl, pageUrl).find(
    (s) => !broken.includes(s),
  );
  if (!src) return null;
  const { tile, icon } = SIZES[size];
  return (
    <span
      aria-hidden="true"
      data-testid="favicon-tile"
      className={`pointer-events-none absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-on-art-surface shadow-[0_1px_2px_var(--shadow-soft),0_4px_12px_var(--shadow-soft)] transition-opacity ${tile} ${loaded === src ? "opacity-100" : "opacity-0"}`}
    >
      <Image
        key={src}
        src={src}
        alt=""
        width={icon}
        height={icon}
        unoptimized
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(src)}
        onError={() => setBroken((b) => [...b, src])}
        className="object-contain"
      />
    </span>
  );
}
