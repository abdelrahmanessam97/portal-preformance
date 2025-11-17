import type { RecycleListResponse } from "~~/types/recycleBin";
import { useApi } from "../useApi";

export const useFetchDocument = () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "recycle-documents",
    () =>
      api<RecycleListResponse>("/recycle-bin/documents", {
        method: "GET",
        params: { page_count: 1000000 },
      }),
    { server: true }
  );

  return { data, pending, error, refresh };
};
