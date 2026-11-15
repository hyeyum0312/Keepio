import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { THEME_KEY } from "@/shared/lib/theme";
import { ThemeToggle } from "./ThemeToggle";

describe("화면 테마 버튼", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    window.localStorage.clear();
  });

  it("라이트에서 누르면 다크로 바뀌고 고른 값이 남는다", async () => {
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: "다크 모드로 보기" }),
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(
      await screen.findByRole("button", { name: "라이트 모드로 보기" }),
    ).toBeInTheDocument();
  });

  it("다크로 골라 둔 상태면 누를 때 라이트로 돌아간다", async () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: "라이트 모드로 보기" }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
