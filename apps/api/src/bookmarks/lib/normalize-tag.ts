// FEAT-010 AC-02 태그 이름 정규화. 표시 이름은 공백만 정리하고, 중복 판정은 영문 소문자까지 맞춘 값으로 한다
export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS_PER_BOOKMARK = 10;
export const MAX_TAGS_PER_USER = 500;

export type TagName = { name: string; normalizedName: string };

export function cleanTagName(input: string): string {
  return input.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function toTagName(input: string): TagName | null {
  const name = cleanTagName(input);
  if (name.length < 1 || name.length > MAX_TAG_LENGTH) return null;
  return { name, normalizedName: name.toLowerCase() };
}

// 같은 이름(정규화 기준)은 처음 것만 남긴다. 순서는 입력 순서
export function uniqueTagNames(inputs: string[]): TagName[] | null {
  const seen = new Set<string>();
  const result: TagName[] = [];
  for (const input of inputs) {
    const tag = toTagName(input);
    if (!tag) return null;
    if (seen.has(tag.normalizedName)) continue;
    seen.add(tag.normalizedName);
    result.push(tag);
  }
  return result;
}
