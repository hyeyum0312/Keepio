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
  it("하위 컴포넌트에 기본 정책이 적용된 QueryClient를 제공한다", () => {
    render(
      <Providers>
        <ReadsQueryClient />
      </Providers>,
    );

    expect(screen.getByText("false")).toBeInTheDocument();
  });
});
