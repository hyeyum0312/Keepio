"use client";

import {
  categoriesControllerList,
  getCategoriesControllerListQueryKey,
  useBookmarksControllerUpdate,
  useCategoriesControllerCreate,
  useCategoriesControllerRemove,
  useCategoriesControllerUpdate,
} from "@keepio/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookmarksControllerListQueryKey } from "@keepio/api-client";
import { serverMessage, submit } from "@/shared/lib/server-message";

// FEAT-008 AC-01. 카테고리 목록(이름순·링크 수는 서버가 정한다)
export function useCategories() {
  return useQuery({
    queryKey: getCategoriesControllerListQueryKey(),
    queryFn: async ({ signal }) => {
      const res = await categoriesControllerList({ signal });
      if (res.status !== 200) throw new Error(res.data.message);
      return res.data;
    },
  });
}

// 만들기 결과. 성공이면 만든(또는 같은 이름으로 이미 있던) 카테고리 ID — 화면은 이것을 골라진 채로 둔다
export type CreateCategoryResult =
  { ok: true; categoryId: string } | { ok: false; message: string };

// FEAT-008 AC-02·13. 이름으로 만든다. 같은 이름이면 409로 받은 기존 카테고리를 쓴다(오류로 보여 주지 않는다)
async function createOrExisting(
  create: ReturnType<typeof useCategoriesControllerCreate>,
  name: string,
): Promise<CreateCategoryResult> {
  const created = await submit(
    () => create.mutateAsync({ data: { name } }),
    (res) => res.status === 201 || res.status === 409,
  );
  if (!created.ok) return { ok: false, message: created.message };
  // 201이면 새로 만든 것, 409면 이미 있던 카테고리를 쓴다(AC-02·13)
  const categoryId =
    created.res.status === 201
      ? created.res.data.id
      : created.res.status === 409
        ? created.res.data.categoryId
        : null;
  return categoryId
    ? { ok: true, categoryId }
    : { ok: false, message: serverMessage(created.res) };
}

// 내 링크 칩 줄의 + 카테고리(CAT-01): 만들기만 한다(링크에 적용하지 않음). 끝나면 카테고리 목록을 다시 받는다
export function useCreateCategory() {
  const create = useCategoriesControllerCreate();
  const queryClient = useQueryClient();

  return async function createCategory(
    name: string,
  ): Promise<CreateCategoryResult> {
    const result = await createOrExisting(create, name);
    await queryClient.invalidateQueries({
      queryKey: getCategoriesControllerListQueryKey(),
    });
    return result;
  };
}

// FEAT-008 AC-13. 만들고 그 링크에 바로 적용한다.
// 적용까지 끝나면 카테고리 목록(링크 수)과 링크 목록을 다시 받는다. 실패하면 서버 문구를 돌려주고 링크는 그대로 둔다
export function useCreateCategoryAndApply() {
  const create = useCategoriesControllerCreate();
  const update = useBookmarksControllerUpdate();
  const queryClient = useQueryClient();

  return async function createAndApply(
    bookmarkId: string,
    name: string,
  ): Promise<CreateCategoryResult> {
    const created = await createOrExisting(create, name);
    if (!created.ok) return created;
    const { categoryId } = created;

    const applied = await submit(
      () => update.mutateAsync({ id: bookmarkId, data: { categoryId } }),
      (res) => res.status === 200,
    );
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCategoriesControllerListQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getBookmarksControllerListQueryKey(),
      }),
    ]);
    return applied.ok
      ? { ok: true, categoryId }
      : { ok: false, message: applied.message };
  };
}

// FEAT-008 AC-04. 카테고리를 지운다(링크는 남고 미분류가 된다). 끝나면 카테고리 목록과 링크 목록(줄의 카테고리 이름)을 다시 받는다.
// 실패하면 서버 문구를 돌려준다
export function useDeleteCategory() {
  const remove = useCategoriesControllerRemove();
  const queryClient = useQueryClient();

  return async function deleteCategory(
    categoryId: string,
  ): Promise<string | null> {
    const res = await submit(
      () => remove.mutateAsync({ id: categoryId }),
      (r) => r.status === 204,
    );
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCategoriesControllerListQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getBookmarksControllerListQueryKey(),
      }),
    ]);
    return res.ok ? null : res.message;
  };
}

// FEAT-008 AC-15. 고정·해제. 끝나면 목록을 다시 받아 순서를 맞춘다(고정이 맨 위)
export function useSetCategoryPinned() {
  const update = useCategoriesControllerUpdate();
  const queryClient = useQueryClient();

  return async function setPinned(
    categoryId: string,
    pinned: boolean,
  ): Promise<string | null> {
    const res = await submit(
      () => update.mutateAsync({ id: categoryId, data: { pinned } }),
      (r) => r.status === 200,
    );
    await queryClient.invalidateQueries({
      queryKey: getCategoriesControllerListQueryKey(),
    });
    return res.ok ? null : res.message;
  };
}

// FEAT-008 AC-09. 이미 있는 카테고리를 링크에 적용한다
export function useApplyCategory() {
  const update = useBookmarksControllerUpdate();
  const queryClient = useQueryClient();

  return async function apply(
    bookmarkId: string,
    categoryId: string | null,
  ): Promise<string | null> {
    const applied = await submit(
      () => update.mutateAsync({ id: bookmarkId, data: { categoryId } }),
      (res) => res.status === 200,
    );
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCategoriesControllerListQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getBookmarksControllerListQueryKey(),
      }),
    ]);
    return applied.ok ? null : applied.message;
  };
}
