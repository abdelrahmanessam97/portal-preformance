import { useApi } from "../useApi";

export const useFetchRolesAndAdmins = async () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(`/roles-to-categories`, () => api(`/roles-to-categories`), {
    server: true,
  });

  const refetchRolesAndAdmins = async () => {
    await refresh();
  };

  return {
    data,
    pending,
    error,
    refresh,
    refetchRolesAndAdmins,
  };
};
