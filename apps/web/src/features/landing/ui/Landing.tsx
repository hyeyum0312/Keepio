import Link from "next/link";

// 로그인 전 첫 화면(02-DESIGN 정보 구조). 기능 위주 최소 UI(D-09 전).
// 명세의 "실제 발행물 예시"는 발행 기능 이후에 넣는다
export function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Keepio</h1>
        <p className="text-lg">Save once. Curate freely. Share beautifully.</p>
      </header>
      <p>
        링크를 저장하면 AI가 분류하고, 카테고리·태그·버킷으로 정리해 템플릿으로
        발행할 수 있어요.
      </p>
      <ol
        className="flex flex-wrap gap-2 text-sm"
        aria-label="Keepio 사용 흐름"
      >
        <li>저장</li>
        <li aria-hidden="true">→</li>
        <li>정리</li>
        <li aria-hidden="true">→</li>
        <li>버킷</li>
        <li aria-hidden="true">→</li>
        <li>발행</li>
      </ol>
      <nav className="flex gap-3">
        <Link href="/signup" className="rounded border px-4 py-2 font-medium">
          시작하기
        </Link>
        <Link href="/login" className="rounded px-4 py-2">
          로그인
        </Link>
      </nav>
    </main>
  );
}
