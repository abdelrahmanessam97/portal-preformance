import { useApi } from "../useApi";

export const useFetchRolesByEntity = async (entity?: string, entityId?: number) => {
  if (!entity || !entityId) {
    return {
      data: ref(null),
      pending: ref(false),
      error: ref(null),
      refresh: () => {},
    };
  }

  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(`roles-entity-${entity}-${entityId}`, () => api(`/roles-entity?entity=${entity}&entity_id=${entityId}`), {
    server: true,
  });

  return {
    data,
    pending,
    error,
    refresh,
  };
};
