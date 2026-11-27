import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriageRow } from "./TriageRow";

// 만들기 성공: 만든 카테고리 ID를 돌려준다
const CREATED = { ok: true as const, categoryId: "c-new" };

const link = {
  id: "l-1",
  url: "https://example.com/1",
  displayTitle: "레퍼런스",
};

describe("FEAT-008 AC-13 최근 추가한 링크에서 카테고리 만들기", () => {
  it("카테고리가 0개면 [카테고리 만들기]로 입력칸을 열고, 이름을 넣어 저장하면 만들고 적용한다", async () => {
    const onCreate = vi.fn(async () => CREATED);
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
    const onCreate = vi.fn(async () => CREATED);
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
    const onCreate = vi.fn(async () => CREATED);
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
    const onCreate = vi.fn(async () => ({
      ok: false as const,
      message: "카테고리는 100개까지 만들 수 있어요.",
    }));
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

  it("카테고리가 있으면 고르기 부품을 열어 검색·고르기·만들기를 한곳에서 한다", async () => {
    const onCreate = vi.fn(async () => CREATED);
    const onSelect = vi.fn();
    render(
      <TriageRow
        link={link}
        categories={[
          { id: "c-1", name: "디자인", bookmarkCount: 3, pinned: false },
          { id: "c-2", name: "모션 그래픽", bookmarkCount: 1, pinned: false },
        ]}
        onCreate={onCreate}
        onSave={onSelect}
        onSkip={vi.fn()}
      />,
    );

    // 열면 글자를 안 넣어도 전체가 보인다
    await userEvent.click(
      screen.getByRole("button", { name: /카테고리 선택/ }),
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);

    // 공백·대소문자를 무시하고 좁혀진다("모션" → "모션 그래픽")
    const q = screen.getByRole("searchbox", { name: "카테고리 검색" });
    await userEvent.type(q, "모션");
    expect(screen.getAllByRole("option")).toHaveLength(1);

    // 맨 아래 만들기로 새로 만든다
    await userEvent.clear(q);
    await userEvent.type(q, "브랜딩");
    await userEvent.click(
      screen.getByRole("button", { name: /새 카테고리 .*브랜딩.* 만들기/ }),
    );
    expect(onCreate).toHaveBeenCalledWith("브랜딩");
  });

  it("똑같은 이름을 넣고 Enter면 만들지 않고 그 카테고리를 고른다", async () => {
    const onCreate = vi.fn(async () => CREATED);
    render(
      <TriageRow
        link={link}
        categories={[
          { id: "c-1", name: "디자인", bookmarkCount: 3, pinned: false },
        ]}
        onCreate={onCreate}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /카테고리 선택/ }),
    );
    await userEvent.type(
      screen.getByRole("searchbox", { name: "카테고리 검색" }),
      " 디자인 {Enter}",
    );

    expect(onCreate).not.toHaveBeenCalled();
    // 고른 카테고리가 버튼에 보인다
    expect(screen.getByRole("button", { name: /디자인/ })).toBeInTheDocument();
  });

  it("이미 카테고리를 정한 링크는 그 카테고리가 골라진 채로 보인다 (D-19)", () => {
    render(
      <TriageRow
        link={{ ...link, categoryId: "c-2" }}
        categories={[
          { id: "c-1", name: "디자인", bookmarkCount: 0, pinned: false },
          { id: "c-2", name: "여행", bookmarkCount: 0, pinned: false },
        ]}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /여행/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /카테고리 선택/ }),
    ).not.toBeInTheDocument();
  });

  it("고르기 목록에서 핀으로 고정·해제한다 (AC-15)", async () => {
    const onPin = vi.fn();
    render(
      <TriageRow
        link={link}
        categories={[
          { id: "c-1", name: "디자인", bookmarkCount: 3, pinned: false },
        ]}
        onCreate={vi.fn()}
        onSave={vi.fn()}
        onPin={onPin}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /카테고리 선택/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "디자인 고정" }));
    expect(onPin).toHaveBeenCalledWith("c-1", true);
  });

  it("onCreate가 없으면(카테고리 서버 전) 고르기 목록에 만들기 줄을 그리지 않는다", async () => {
    render(
      <TriageRow
        link={link}
        categories={[
          { id: "c-1", name: "디자인", bookmarkCount: 0, pinned: false },
        ]}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /카테고리 선택/ }),
    );
    await userEvent.type(
      screen.getByRole("searchbox", { name: "카테고리 검색" }),
      "브랜딩",
    );
    expect(
      screen.queryByRole("button", { name: /새 카테고리/ }),
    ).not.toBeInTheDocument();
  });
});

describe("FEAT-008 AC-13 만든 카테고리는 골라진 채로 남는다", () => {
  it("0개에서 만들면 목록을 다시 받은 뒤 고르기에 그 카테고리가 골라져 있다", async () => {
    const onCreate = vi.fn(async () => CREATED);
    const { rerender } = render(
      <TriageRow
        link={link}
        createCategory
        onCreate={onCreate}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "카테고리 만들기" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "새 카테고리 이름" }),
      "브랜딩{Enter}",
    );

    // 서버가 새 목록을 준 뒤(카테고리 1개)
    rerender(
      <TriageRow
        link={{ ...link, categoryId: "c-new" }}
        createCategory
        categories={[
          { id: "c-new", name: "브랜딩", bookmarkCount: 1, pinned: false },
        ]}
        onCreate={onCreate}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    // 고르기 버튼의 이름이 고른 카테고리가 된다
    expect(screen.getByRole("button", { name: /브랜딩/ })).toHaveAttribute(
      "aria-haspopup",
      "listbox",
    );
  });

  it("고르기 부품에서 만들면 닫히면서 그 카테고리가 골라진다", async () => {
    const onCreate = vi.fn(async () => CREATED);
    const categories = [
      { id: "c-1", name: "디자인", bookmarkCount: 3, pinned: false },
    ];
    const { rerender } = render(
      <TriageRow
        link={link}
        categories={categories}
        onCreate={onCreate}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /카테고리 선택/ }),
    );
    await userEvent.type(
      screen.getByRole("searchbox", { name: "카테고리 검색" }),
      "브랜딩{Enter}",
    );
    expect(onCreate).toHaveBeenCalledWith("브랜딩");
    expect(
      screen.queryByRole("searchbox", { name: "카테고리 검색" }),
    ).not.toBeInTheDocument();

    rerender(
      <TriageRow
        link={link}
        categories={[
          ...categories,
          { id: "c-new", name: "브랜딩", bookmarkCount: 1, pinned: false },
        ]}
        onCreate={onCreate}
        onSave={vi.fn()}
        onSkip={vi.fn()}
      />,
    );
    // 고르기 버튼의 이름이 고른 카테고리가 된다
    expect(screen.getByRole("button", { name: /브랜딩/ })).toHaveAttribute(
      "aria-haspopup",
      "listbox",
    );
  });
});
