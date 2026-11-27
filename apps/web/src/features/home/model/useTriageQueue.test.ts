import { act, renderHook } from "@testing-library/react";
import { useTriageQueue } from "./useTriageQueue";

const a = { id: "a" };
const b = { id: "b" };
const c = { id: "c" };

describe("useTriageQueue (FEAT-009)", () => {
  it("보고 있는 링크는 목록 순서가 바뀌어도 그대로 둔다(카테고리를 정해 뒤로 밀려도)", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useTriageQueue(items),
      { initialProps: { items: [a, b, c] } },
    );
    expect(result.current.current).toBe(a);

    // 카테고리를 정해 미분류 묶음 뒤로 밀린 경우
    rerender({ items: [b, c, a] });
    expect(result.current.current).toBe(a);
  });

  it("건너뛰면 남은 것 중 맨 앞으로 넘어가고, 보던 링크가 목록에서 사라져도 맨 앞으로 간다", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useTriageQueue(items),
      { initialProps: { items: [a, b, c] } },
    );
    act(() => result.current.skip("a"));
    expect(result.current.current).toBe(b);
    expect(result.current.remaining).toBe(2);

    rerender({ items: [a, c] });
    expect(result.current.current).toBe(c);
  });
});
