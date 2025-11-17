import { useApi } from "~/composables/useApi";
import type { RoleUpdateData } from "./../../../types/role";

export const useUpdateRole = async (roleId: number, formData: RoleUpdateData) => {
  try {
    const api = useApi();
    const response = await api(`/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(formData),
    });

    return { data: response, error: null };
  } catch (error: unknown) {
    const errorData = error as { data?: unknown };
    return { data: null, error: errorData.data || error };
  }
};
