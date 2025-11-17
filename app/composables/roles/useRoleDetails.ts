import { useApi } from "../useApi";

export const useRoleDetails = async (roleId: number) => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(`role-details-${roleId}`, () => api(`/roles/${roleId}`), {
    server: true,
    immediate: false, // Don't fetch immediately
  });

  return {
    data,
    pending,
    error,
    refresh,
  };
};
