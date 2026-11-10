import { render, screen } from "@testing-library/react";
import { Landing } from "./Landing";

describe("Landing", () => {
  it("FEAT-006 AC-12: 비로그인 홈에서 가입과 로그인으로 갈 수 있다", () => {
    render(<Landing />);

    expect(screen.getByRole("heading", { name: "Keepio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "시작하기" })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
