"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, currentTheme, type Theme } from "@/shared/lib/theme";

// html[data-theme]이나 시스템 설정이 바뀌면 다시 그린다
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media?.removeEventListener("change", onChange);
  };
}

// 라이트·다크 전환 버튼. 서버 렌더 때는 테마를 모르므로(null) 하이드레이션 뒤에 아이콘을 맞춘다
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(
    subscribe,
    currentTheme,
    () => null,
  );

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={next === "dark" ? "다크 모드로 보기" : "라이트 모드로 보기"}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground focus-visible:focus-ring ${className}`}
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        )}
      </svg>
    </button>
  );
}
