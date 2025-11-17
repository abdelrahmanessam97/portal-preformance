import { useAsyncData } from "nuxt/app";
import { computed } from "vue";
import type { FileResponse } from "~~/types/file";
import { useApi } from "../useApi";

interface ApiFileResponse {
  status_code: number;
  message: string;
  data: FileResponse;
}

export const useGetFile = (id: number) => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    `file-${id}`,
    () =>
      api<ApiFileResponse>(`/files/${id}`, {
        method: "GET",
      }),
    {
      server: true,
    }
  );

  const fileDetail = computed(() => {
    if (!data.value?.data) return undefined;
    return data.value.data;
  });

  const assignedRolesToFile = computed(() => {
    if (!fileDetail.value?.roles_has_access) return [];
    return fileDetail.value.roles_has_access.map((role: { id: number; name: string }) => ({
      id: role.id,
      name: role.name,
    }));
  });

  const assignedAdminsToFile = computed(() => {
    if (!fileDetail.value?.admins_has_access) return [];
    return fileDetail.value.admins_has_access.map((admin: { id: number; name: string; role_id?: number }) => ({
      id: admin.id,
      name: admin.name,
      role_id: admin.role_id,
    }));
  });

  const refreshGetFile = async () => {
    await refresh();
  };
  return { data, pending, error, refresh, refreshGetFile, fileDetail, assignedRolesToFile, assignedAdminsToFile };
};
