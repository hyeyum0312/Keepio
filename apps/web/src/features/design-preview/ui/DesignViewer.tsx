"use client";

import { useSearchParams } from "next/navigation";
import { findDesignItem } from "../model/items";

// 고른 기획·디자인을 본문에 보여준다. 앱 안 사본은 그대로 띄우고, claude.ai 시안은 새 탭 버튼
export function DesignViewer() {
  const item = findDesignItem(useSearchParams().get("view"));
  if (item.embed) {
    return (
      <iframe
        title={item.label}
        src={item.src}
        className="h-dvh w-full border-0"
      />
    );
  }
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-10">
      <h1 className="text-xl font-bold">{item.label}</h1>
      <p className="text-sm text-muted-foreground">
        claude.ai 시안은 앱 안에 띄울 수 없어 새 탭에서 열어요. claude.ai에
        로그인돼 있어야 보여요.
      </p>
      <a
        href={item.src}
        target="_blank"
        rel="noreferrer"
        className="self-start rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:focus-ring"
      >
        새 탭에서 열기 ↗
      </a>
    </main>
  );
}
