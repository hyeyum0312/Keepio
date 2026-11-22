// FEAT-008 AC-14·15. 정렬은 서버가 정한다(DB collation은 환경마다 달라 쓰지 않는다).
// 고정한 카테고리가 먼저(고정한 순서), 그다음 첫 글자 종류 순서: 한글 → 영문 → 숫자 → 그 밖(특수문자 등).
// 같은 종류 안에서는 한국어 기준 이름순
const collator = new Intl.Collator("ko");

const HANGUL = /^[가-힣ㄱ-ㅎㅏ-ㅣ]/;
const LATIN = /^[A-Za-z]/;
const DIGIT = /^[0-9]/;

export function nameGroup(name: string): number {
  if (HANGUL.test(name)) return 0;
  if (LATIN.test(name)) return 1;
  if (DIGIT.test(name)) return 2;
  // 특수문자와 그 밖의 문자(한자·일본어 등)
  return 3;
}

export function compareCategories<
  T extends { name: string; pinnedAt: Date | null },
>(a: T, b: T): number {
  if (a.pinnedAt && b.pinnedAt) {
    return a.pinnedAt.getTime() - b.pinnedAt.getTime();
  }
  if (a.pinnedAt) return -1;
  if (b.pinnedAt) return 1;
  const group = nameGroup(a.name) - nameGroup(b.name);
  return group !== 0 ? group : collator.compare(a.name, b.name);
}
