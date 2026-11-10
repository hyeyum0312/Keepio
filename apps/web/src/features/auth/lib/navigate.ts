// 다른 출처(API·제공자)로 페이지 전체를 이동한다. 테스트에서 대체할 수 있게 분리
export function navigateTo(url: string) {
  window.location.assign(url);
}
