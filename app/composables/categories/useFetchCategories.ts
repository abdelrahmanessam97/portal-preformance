import { useAsyncData } from "nuxt/app";
import { useApi } from "../useApi";
import type { CategoryResponse } from "./../../../types/category";

interface ApiCategoryResponse {
  status_code: number;
  message: string;
  data: CategoryResponse[];
}

export const useFetchCategories = (page_count: number = 1000000, search: string = "") => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "categories",
    () =>
      api<ApiCategoryResponse>("/categories", {
        method: "GET",
        query: {
          page_count,
          search,
        },
      }),
    {
      server: true,
    }
  );

  const refreshFetchCategories = async () => {
    await refresh();
  };
  return { data, pending, error, refresh, refreshFetchCategories };
};
