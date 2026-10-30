import { bookmarksControllerSave } from "@keepio/api-client";
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

  it("개발 모드에서는 API 요청에 개발용 사용자 헤더를 붙이고 요청별 헤더도 유지한다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }));

    await bookmarksControllerSave({ url: "https://example.com" });

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(url).toBe("http://localhost:7711/api/bookmarks");
    expect(headers.get("x-dev-user-id")).toBe(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(headers.get("content-type")).toBe("application/json");
    fetchMock.mockRestore();
  });
});
