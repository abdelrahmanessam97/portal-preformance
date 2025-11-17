import { useAsyncData } from "nuxt/app";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import type { SingleCategoryResponse } from "~~/types/category";
import { useApi } from "../useApi";

interface ApiSingleCategoryResponse {
  status_code: number;
  message: string;
  data: SingleCategoryResponse | null;
}
export const useGetCategory = (id: MaybeRefOrGetter<number | null | undefined>) => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    () => `category-${toValue(id)}`,
    async () => {
      const categoryId = toValue(id);
      if (!categoryId || categoryId === 0) {
        return { data: null, status_code: 200, message: "No category ID provided" } satisfies ApiSingleCategoryResponse;
      }
      return await api<ApiSingleCategoryResponse>(`/categories/${categoryId}`, {
        method: "GET",
      });
    },
    {
      server: true,
    }
  );

  const categoryDetail = computed(() => {
    const payload = data.value?.data as unknown;
    if (!payload) return undefined;
    return Array.isArray(payload) ? payload[0] : (payload as SingleCategoryResponse);
  });

  const assignedRolesToCategory = computed(() => {
    if (!categoryDetail.value?.roles_has_access) return [];
    return categoryDetail.value.roles_has_access.map((role: { id: number; name: string }) => ({
      id: role.id,
      name: role.name,
    }));
  });

  const assignedAdminsToCategory = computed(() => {
    if (!categoryDetail.value?.admins_has_access) return [];
    return categoryDetail.value.admins_has_access.map((admin: { id: number; name: string; role_id: number }) => ({
      id: admin.id,
      name: admin.name,
      role_id: admin.role_id,
    }));
  });

  return {
    data,
    pending,
    error,
    refresh,
    categoryDetail,
    assignedRolesToCategory,
    assignedAdminsToCategory,
  };
};
