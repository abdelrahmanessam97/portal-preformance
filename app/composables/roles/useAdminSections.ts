import { useApi } from "../useApi";

export const useAdminSections = async () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData("admin-sections", () => api(`/admin-sections`), {
    server: true,
    immediate: true,
  });

  return {
    data,
    pending,
    error,
    refresh,
  };
};
