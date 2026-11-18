import { describe, expect, it } from "vitest";
import { sniffImageType } from "./image-type.js";

const bytes = (...v: number[]) => Uint8Array.from(v);
const ascii = (s: string) => Uint8Array.from(Buffer.from(s, "latin1"));

describe("sniffImageType (FEAT-010 AC-06·10)", () => {
  it("AC-06: JPG·PNG·GIF·WEBP를 앞 바이트로 알아본다", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
    expect(
      sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
        ?.ext,
    ).toBe("png");
    expect(sniffImageType(ascii("GIF89a....."))?.ext).toBe("gif");
    expect(sniffImageType(ascii("RIFF\0\0\0\0WEBPVP8 "))?.ext).toBe("webp");
  });

  it("AC-06: 이름만 이미지인 다른 파일(SVG·HTML·빈 파일)은 거부한다", () => {
    expect(
      sniffImageType(ascii("<svg xmlns='http://www.w3.org/2000/svg'>")),
    ).toBeNull();
    expect(sniffImageType(ascii("<!doctype html>"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});
