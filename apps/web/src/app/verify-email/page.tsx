import { Suspense } from "react";
import { VerifyEmail } from "@/features/auth";

// 주소의 토큰을 읽는 컴포넌트는 Suspense 안에 둔다(Next 16 useSearchParams, 운영 빌드 필수)
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
