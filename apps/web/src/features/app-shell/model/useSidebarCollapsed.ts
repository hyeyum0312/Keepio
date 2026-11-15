"use client";

import { useSyncExternalStore } from "react";

// 사이드바 접힘 상태(화면 표시용 값이라 클라이언트에만 둔다). 새로고침해도 유지하려고 localStorage에 남긴다
const KEY = "keepio.sidebarCollapsed";
const EVENT = "keepio:sidebar";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSidebarCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = () => {
    try {
      window.localStorage.setItem(KEY, collapsed ? "0" : "1");
    } catch {
      // 저장소를 못 쓰면 이번 방문에서도 바뀌지 않는다(표시용이라 무시)
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [collapsed, toggle];
}
