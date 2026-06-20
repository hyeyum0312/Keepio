import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Hello() {
  return <h1>Keepio</h1>;
}

describe("test setup", () => {
  it("renders a component with jest-dom matchers", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: "Keepio" })).toBeInTheDocument();
  });
});
