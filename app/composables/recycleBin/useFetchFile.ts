import type { RecycleListResponse } from "~~/types/recycleBin";
import { useApi } from "../useApi";

export const useFetchFile = () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "recycle-files",
    () =>
      api<RecycleListResponse>("/recycle-bin/files", {
        method: "GET",
        params: { page_count: 1000000 },
      }),
    { server: true }
  );

  return { data, pending, error, refresh };
};
