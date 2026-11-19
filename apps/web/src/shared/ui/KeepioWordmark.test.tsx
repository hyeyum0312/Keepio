import { render, screen } from "@testing-library/react";
import { KeepioIcon, KeepioWordmark } from "./KeepioWordmark";

describe("로고(ADR-016)", () => {
  it("워드마크는 이름 keepio로 읽히고 마침표가 없다", () => {
    render(<KeepioWordmark />);
    const logo = screen.getByRole("img", { name: "keepio" });
    expect(logo.textContent).not.toContain(".");
  });

  it("작은 마크도 이름 keepio로 읽힌다", () => {
    render(<KeepioIcon />);
    expect(screen.getByRole("img", { name: "keepio" })).toBeInTheDocument();
  });
});
