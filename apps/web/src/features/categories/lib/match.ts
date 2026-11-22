// FEAT-008 AC-13. 고르기 목록의 찾기는 중복 판정보다 느슨하다: 공백을 떼고 영문 소문자로 맞춰 비교한다.
// "모션"으로 "모션 그래픽"·"모션그래픽"이 모두 나온다(비슷한 이름을 새로 만드는 것을 입구에서 막는다)
export function loose(name: string): string {
  return name.normalize("NFC").replace(/\s+/g, "").toLowerCase();
}

export function matches(name: string, query: string): boolean {
  return loose(name).includes(loose(query));
}

// 서버의 중복 판정과 같은 기준(앞뒤 공백 제거·연속 공백 1칸·영문 소문자).
// 똑같은 이름이 이미 있으면 만들지 않고 그 카테고리를 고른다
export function sameName(name: string, query: string): boolean {
  const norm = (v: string) =>
    v.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
  return norm(name) === norm(query);
}
