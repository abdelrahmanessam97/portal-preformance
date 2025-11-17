import { useApi } from "~/composables/useApi";
import type { RoleFormData } from "~~/types/role";

export const useCreateRole = async (formData: RoleFormData) => {
  try {
    const api = useApi();
    const response = await api("/roles", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    return { data: response, error: null };
  } catch (error: unknown) {
    const errorData = error as { data?: unknown };
    return { data: null, error: errorData.data || error };
  }
};
