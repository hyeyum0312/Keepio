// FEAT-010 AC-06·10. 확장자·Content-Type이 아니라 파일 앞 바이트로 형식을 판정한다
export type ImageType = { ext: "jpg" | "png" | "gif" | "webp"; mime: string };

export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    b.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)
  ) {
    return { ext: "png", mime: "image/png" };
  }
  const head = String.fromCharCode(...b.subarray(0, 12));
  if (head.startsWith("GIF87a") || head.startsWith("GIF89a")) {
    return { ext: "gif", mime: "image/gif" };
  }
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}
