import { useApi } from "~/composables/useApi";
import type { AdminsListResponse } from "~~/types/admin";

export const useFetchAdmins = () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "admins",
    () =>
      api<AdminsListResponse>("/admins", {
        method: "GET",
        params: { page_count: 1000000 },
      }),
    { server: true }
  );

  return { data, pending, error, refresh };
};
