import { AccountPanel, AuthSwitch } from "@/features/auth";
import { Landing } from "@/features/landing";

// 로그인 상태면 계정 화면, 아니면 랜딩(FEAT-006 AC-12)
export default function Home() {
  return (
    <AuthSwitch authenticated={<AccountPanel />} anonymous={<Landing />} />
  );
}
