import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// next/font는 Next 컴파일러가 빌드 때 변환한다. vitest에는 그 단계가 없어 클래스 이름만 흉내 낸다
vi.mock("next/font/google", () => ({
  Outfit: () => ({ className: "font-outfit", style: {} }),
}));

afterEach(() => {
  cleanup();
});
