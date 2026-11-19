import { FALLBACK_ART, fallbackArtFor } from "./fallback-art";

describe("fallbackArtFor", () => {
  it("같은 ID는 늘 같은 그림, 여러 ID는 여러 그림에 고르게 나뉜다", () => {
    expect(fallbackArtFor("id-1")).toBe(fallbackArtFor("id-1"));
    const used = new Set(
      Array.from({ length: 40 }, (_, i) => fallbackArtFor(`bookmark-${i}`)),
    );
    expect(used.size).toBe(FALLBACK_ART.length);
  });
});
