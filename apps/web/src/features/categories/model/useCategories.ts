"use client";

import {
  categoriesControllerList,
  getCategoriesControllerListQueryKey,
  useBookmarksControllerUpdate,
  useCategoriesControllerCreate,
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

// FEAT-008 AC-13. 만들고 그 링크에 바로 적용한다. 같은 이름이면 409로 받은 기존 카테고리를 쓴다(오류로 보여 주지 않는다).
// 적용까지 끝나면 카테고리 목록(링크 수)과 링크 목록을 다시 받는다. 실패하면 서버 문구를 돌려주고 링크는 그대로 둔다
export function useCreateCategoryAndApply() {
  const create = useCategoriesControllerCreate();
  const update = useBookmarksControllerUpdate();
  const queryClient = useQueryClient();

  return async function createAndApply(
    bookmarkId: string,
    name: string,
  ): Promise<string | null> {
    const created = await submit(
      () => create.mutateAsync({ data: { name } }),
      (res) => res.status === 201 || res.status === 409,
    );
    if (!created.ok) return created.message;
    // 201이면 새로 만든 것, 409면 이미 있던 카테고리를 쓴다(AC-02·13)
    const categoryId =
      created.res.status === 201
        ? created.res.data.id
        : created.res.status === 409
          ? created.res.data.categoryId
          : null;
    if (!categoryId) return serverMessage(created.res);

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
