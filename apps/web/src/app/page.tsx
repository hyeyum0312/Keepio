import { AccountPanel, RequireAuth } from "@/features/auth";

export default function Home() {
  return (
    <RequireAuth>
      <AccountPanel />
    </RequireAuth>
  );
}
