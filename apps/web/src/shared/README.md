# shared (web)

**웹 전용 공용 코드.** 플랫폼(React DOM·Tailwind)에 의존하는 공용 자원만 둔다.

| 세그먼트 | 용도                                                     |
| -------- | -------------------------------------------------------- |
| `ui`     | 웹 디자인 시스템 (Button, Sheet 등). RN은 자체 ui를 가짐 |

> 플랫폼 무관 공용 코드(`api`·`lib`·`config`·`types`)는 여기가 아니라 **`@keepio/core`의 shared**에 있다. 양쪽(web·mobile)이 함께 쓰기 때문이다.
