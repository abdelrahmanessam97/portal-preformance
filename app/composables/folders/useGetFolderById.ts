import { useAsyncData } from "nuxt/app";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { useApi } from "../useApi";

interface FileItem {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  folder_id: number;
  folder_title: string;
  doc_count: number;
  created_at: string;
  deleted_at: string | null;
  restored_by_children: boolean;
}

export type AdminAccess = {
  id: number;
  name: string;
  role_id: number;
};

export type Permission = {
  id: number;
  title: string;
};

export type RoleAccess = {
  id: number;
  name: string;
  count_users: number;
  count_permission: number;
  permissions: Permission[];
};

interface ApiFolderResponse {
  status_code: number;
  message: string;
  data: {
    id: number;
    title: string;
    title_ar: string;
    title_en: string;
    category_id: number;
    category_title: string;
    file_count: number;
    created_at: string;
    deleted_at: string | null;
    restored_by_children: boolean;
    admins_has_access?: AdminAccess[];
    roles_has_access?: RoleAccess[];
    files: FileItem[];
  } | null;
}

export const useGetFolderById = (folderId: MaybeRefOrGetter<number | undefined | null>) => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    () => `folder-${toValue(folderId) || "null"}`,
    async () => {
      const id = toValue(folderId);
      if (!id) {
        return { data: null, status_code: 200, message: "No folder ID provided" } satisfies ApiFolderResponse & { data: null };
      }
      return await api<ApiFolderResponse>(`/folders/${id}`, {
        method: "GET",
      });
    },
    {
      server: true,
    }
  );

  const folderDetail = computed(() => {
    if (!data.value?.data) return undefined;
    return data.value.data;
  });

  const assignedRolesToFolder = computed(() => {
    if (!folderDetail.value?.roles_has_access) return [];
    return folderDetail.value.roles_has_access.map((role: { id: number; name: string }) => ({
      id: role.id,
      name: role.name,
    }));
  });

  const assignedAdminsToFolder = computed(() => {
    if (!folderDetail.value?.admins_has_access) return [];
    return folderDetail.value.admins_has_access.map((admin: { id: number; name: string; role_id: number }) => ({
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
    folderDetail,
    assignedRolesToFolder,
    assignedAdminsToFolder,
  };
};
