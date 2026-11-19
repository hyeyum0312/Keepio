import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// next/font는 Next 빌드에서만 동작한다. 테스트에서는 클래스 이름만 돌려준다(로고 워드마크 등)
vi.mock("next/font/google", () => ({
  Young_Serif: () => ({ className: "font-young-serif" }),
}));

afterEach(() => {
  cleanup();
});
