import { color } from "@keepio/core";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      {/* @keepio/core 토큰이 웹에서 정상 import 되는지 확인용 (추후 제거) */}
      <span className="sr-only" style={{ color: color.ai }}>
        Keepio
      </span>
    </main>
  );
}
