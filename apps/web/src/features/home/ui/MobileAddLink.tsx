"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { SaveBookmarkForm } from "@/features/bookmarks";
import { HomeIcon } from "./HomeIcons";

const TIP_KEY = "keepio.home.firstSaveTipDismissed";

function noop() {
  return () => {};
}

function tipDismissed() {
  try {
    return window.localStorage.getItem(TIP_KEY) === "1";
  } catch {
    return false;
  }
}

// 모바일 링크 추가(07-BRAND, 2026-11-21 상태 시트 6번): 본문 저장 칸 대신 오른쪽 아래 + 버튼.
// 누르면 아래에서 시트가 올라오고 같은 저장 폼을 쓴다. 저장하면 시트를 닫는다.
// tip: 처음 온 사용자(링크 0개)에게만 버튼 옆 말풍선. 닫으면 이 기기에서는 다시 나오지 않고, 첫 저장 뒤에는 tip이 꺼진다.
// PC(md 이상)에서는 그리지 않는다(본문 저장 카드)
export function MobileAddLink({
  open,
  onOpenChange,
  tip = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tip?: boolean;
}) {
  const titleId = useId();
  const fabRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // 저장된 "닫음"은 브라우저에서만 읽는다(서버 렌더에서는 숨김으로 본다)
  const storedDismissed = useSyncExternalStore(noop, tipDismissed, () => true);
  const [closedNow, setClosedNow] = useState(false);
  const hideTip = storedDismissed || closedNow;

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    // 시트가 열린 채 PC 폭이 되면 닫는다(PC는 본문 저장 카드)
    const wide = window.matchMedia?.("(min-width: 768px)");
    function onWide() {
      if (wide?.matches) onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    wide?.addEventListener?.("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide?.removeEventListener?.("change", onWide);
    };
  }, [open, onOpenChange]);

  function close() {
    onOpenChange(false);
    fabRef.current?.focus();
  }

  function dismissTip() {
    setClosedNow(true);
    try {
      window.localStorage.setItem(TIP_KEY, "1");
    } catch {
      // 저장하지 못해도 이번 화면에서는 닫힌다
    }
  }

  return (
    <div className="md:hidden">
      {/* 하단 탭(약 64px) 위에 띄운다 */}
      <div className="fixed right-5 bottom-[84px] z-30 flex items-center gap-3.5">
        {tip && !hideTip && !open && (
          <p
            role="status"
            className="relative inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary py-0 pr-1 pl-3.5 text-[13px] font-medium whitespace-nowrap text-primary-foreground after:absolute after:top-1/2 after:-right-1.5 after:-mt-1.5 after:border-y-[6px] after:border-l-[6px] after:border-y-transparent after:border-l-primary"
          >
            여기서 첫 링크를 저장해 보세요
            <button
              type="button"
              onClick={dismissTip}
              aria-label="안내 닫기"
              className="inline-flex size-8 items-center justify-center rounded-lg opacity-80 focus-visible:focus-ring"
            >
              <HomeIcon name="close" size={14} />
            </button>
          </p>
        )}
        <button
          ref={fabRef}
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="링크 추가"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_1px_2px_var(--shadow-soft),0_8px_24px_var(--shadow-soft)] focus-visible:focus-ring"
        >
          <HomeIcon name="plus" size={24} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40">
          <div
            aria-hidden="true"
            onClick={close}
            className="kp-backdrop absolute inset-0"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-3xl bg-surface px-5 pt-2.5 pb-7 shadow-[0_-8px_24px_var(--shadow-soft)]"
          >
            <div
              aria-hidden="true"
              className="h-1 w-9 self-center rounded-full bg-border"
            />
            <div className="-mt-1 flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-bold">
                링크 추가
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="-mr-2.5 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground focus-visible:focus-ring"
              >
                <HomeIcon name="close" size={20} />
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground">
              링크를 붙여넣으면 제목·썸네일을 자동으로 가져와요.
            </p>
            <SaveBookmarkForm onSaved={close} />
          </div>
        </div>
      )}
    </div>
  );
}
