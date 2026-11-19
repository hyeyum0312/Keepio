import { apiUrl, type BookmarkThumbnailResponse } from "@keepio/api-client";

// FEAT-010 AC-11. 썸네일을 불러 볼 순서: 우리 서버에 보관한 파일 → 링크 페이지의 원본(og:image).
// 보관 파일은 서명이 만료되거나 서버 디스크가 초기화되면 못 쓴다. 둘 다 안 되면 화면이 아트워크를 그린다
export function thumbnailSources(
  thumbnail: Pick<BookmarkThumbnailResponse, "status" | "url"> & {
    sourceUrl?: string | null;
  },
): string[] {
  const sources: string[] = [];
  if (thumbnail.status === "ready" && thumbnail.url) {
    sources.push(apiUrl(thumbnail.url));
  }
  if (thumbnail.sourceUrl) sources.push(thumbnail.sourceUrl);
  return sources;
}
