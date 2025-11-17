import { useApi } from "../useApi";

export const useActions = async () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData("actions", () => api(`/actions`), {
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
