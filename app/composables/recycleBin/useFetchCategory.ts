import { useApi } from "../useApi";
import type { RecycleListResponse } from "./../../../types/recycleBin";

export const useFetchCategory = () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "recycle-categories",
    () =>
      api<RecycleListResponse>("/recycle-bin/categories", {
        method: "GET",
        params: { page_count: 1000000 },
      }),
    { server: true }
  );

  // const refreshRecycleCategories = async () => {
  //   await refresh();
  // };

  return { data, pending, error, refresh };
};
