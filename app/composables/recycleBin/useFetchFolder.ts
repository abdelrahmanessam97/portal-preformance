import type { RecycleListResponse } from "~~/types/recycleBin";
import { useApi } from "../useApi";

export const useFetchFolder = () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "recycle-folders",
    () =>
      api<RecycleListResponse>("/recycle-bin/folders", {
        method: "GET",
        params: { page_count: 1000000 },
      }),
    { server: true }
  );

  return { data, pending, error, refresh };
};
