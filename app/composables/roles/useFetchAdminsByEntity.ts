import { useApi } from "../useApi";

export const useFetchAdminsByEntity = async (entity?: string, entityId?: number) => {
  if (!entity || !entityId) {
    return {
      data: ref(null),
      pending: ref(false),
      error: ref(null),
      refresh: () => {},
    };
  }

  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(`admins-entity-${entity}-${entityId}`, () => api(`/admins-entity?entity=${entity}&entity_id=${entityId}`), {
    server: true,
  });

  return {
    data,
    pending,
    error,
    refresh,
  };
};
