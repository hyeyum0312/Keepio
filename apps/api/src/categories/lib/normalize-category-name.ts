// FEAT-008 AC-02 카테고리 이름 정규화. 표시 이름은 공백만 정리하고, 중복 판정은 영문 소문자까지 맞춘 값으로 한다(태그와 같은 규칙)
export const MAX_CATEGORY_LENGTH = 20;
export const MAX_CATEGORIES_PER_USER = 100;

export type CategoryName = { name: string; normalizedName: string };

export function cleanCategoryName(input: string): string {
  return input.normalize("NFC").trim().replace(/\s+/g, " ");
}

// 1~20자를 벗어나면 null(서비스가 400으로 바꾼다)
export function toCategoryName(input: string): CategoryName | null {
  const name = cleanCategoryName(input);
  if (name.length < 1 || name.length > MAX_CATEGORY_LENGTH) return null;
  return { name, normalizedName: name.toLowerCase() };
}
