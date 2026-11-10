import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Providers } from "./providers";

function ReadsQueryClient() {
  const client = useQueryClient();
  return (
    <p>{String(client.getDefaultOptions().queries?.refetchOnWindowFocus)}</p>
  );
}

describe("Providers", () => {
  // AuthBootstrap이 시작 시 refresh를 보낸다. 실제 네트워크에 닿지 않게 비로그인 응답으로 대체
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("하위 컴포넌트에 기본 정책이 적용된 QueryClient를 제공한다", () => {
    render(
      <Providers>
        <ReadsQueryClient />
      </Providers>,
    );

    expect(screen.getByText("false")).toBeInTheDocument();
  });
});
