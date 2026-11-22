import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriageRow } from "./TriageRow";

const link = {
  id: "l-1",
  url: "https://example.com/1",
  displayTitle: "레퍼런스",
};

describe("FEAT-008 AC-13 최근 추가한 링크에서 카테고리 만들기", () => {
  it("카테고리가 0개면 [카테고리 만들기]로 입력칸을 열고, 이름을 넣어 저장하면 만들고 적용한다", async () => {
    const onCreate = vi.fn(async () => null);
    render(
      <TriageRow
        link={link}
        createCategory
        onCreate={onCreate}
        onSkip={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "카테고리 만들기" }),
    );
    const box = screen.getByRole("textbox", { name: "새 카테고리 이름" });
    expect(box).toHaveFocus();

    await userEvent.type(box, " 브랜딩 ");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    // 앞뒤 공백은 떼고 보낸다
    expect(onCreate).toHaveBeenCalledWith("브랜딩");
    expect(
      screen.queryByRole("textbox", { name: "새 카테고리 이름" }),
    ).not.toBeInTheDocument();
  });

  it("Enter로도 저장한다", async () => {
    const onCreate = vi.fn(async () => null);
    render(
      <TriageRow
        link={link}
        createCategory
        onCreate={onCreate}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "카테고리 만들기" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "여행{Enter}",
    );
    expect(onCreate).toHaveBeenCalledWith("여행");
  });

  it("20자를 넘으면 오류 테두리와 문구를 보여 주고 저장을 막는다", async () => {
    const onCreate = vi.fn(async () => null);
    render(
      <TriageRow
        link={link}
        createCategory
        onCreate={onCreate}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "카테고리 만들기" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "가".repeat(21),
    );

    expect(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("카테고리 이름은 1~20자로 입력해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("빈 이름이면 저장을 막고 오류 문구는 보여 주지 않는다", async () => {
    render(
      <TriageRow
        link={link}
        createCategory
        onCreate={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "카테고리 만들기" }),
    );
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    expect(
      screen.queryByText("카테고리 이름은 1~20자로 입력해 주세요."),
    ).not.toBeInTheDocument();
  });

  it("만들기가 실패하면 서버 문구를 보여 주고 입력칸을 열어 둔다", async () => {
    const onCreate = vi.fn(async () => "카테고리는 100개까지 만들 수 있어요.");
    render(
      <TriageRow
        link={link}
        createCategory
        onCreate={onCreate}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "카테고리 만들기" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "여행{Enter}",
    );

    expect(
      await screen.findByText("카테고리는 100개까지 만들 수 있어요."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
    ).toBeInTheDocument();
  });

  it("카테고리가 있으면 고르기 맨 아래 '새 카테고리'로 입력칸을 연다", async () => {
    render(
      <TriageRow
        link={link}
        categories={[{ id: "c-1", name: "디자인" }]}
        onCreate={vi.fn()}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "카테고리" }),
      "__new",
    );
    expect(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
    ).toBeInTheDocument();
  });

  it("이미 카테고리를 정한 링크는 그 카테고리가 골라진 채로 보인다 (D-19)", () => {
    render(
      <TriageRow
        link={{ ...link, categoryId: "c-2" }}
        categories={[
          { id: "c-1", name: "디자인" },
          { id: "c-2", name: "여행" },
        ]}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: "카테고리" })).toHaveValue(
      "c-2",
    );
  });

  it("onCreate가 없으면(카테고리 서버 전) 만들기는 준비 중이고 '새 카테고리'도 없다", async () => {
    render(
      <TriageRow
        link={link}
        categories={[{ id: "c-1", name: "디자인" }]}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("option", { name: "새 카테고리" }),
    ).not.toBeInTheDocument();
  });
});
