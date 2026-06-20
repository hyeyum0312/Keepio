/**
 * 디자인 토큰 — 웹·RN 공유 단일 진실 공급원(SSOT).
 * 웹: apps/web/src/app/globals.css 의 @theme 와 값을 맞춘다.
 * RN: StyleSheet / NativeWind 에서 이 값을 직접 사용한다.
 */
export const color = {
  background: "#ffffff",
  foreground: "#171717",
  /** AI 기능 전용 강조색 (STYLING.md) */
  ai: "#7f77dd",
} as const;

export type ColorToken = keyof typeof color;
