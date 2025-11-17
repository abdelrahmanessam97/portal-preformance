import { useApi } from "~/composables/useApi";
import type { AssignRoleFormData } from "~~/types/role";

export const UseAssignRole = async (formData: AssignRoleFormData) => {
  try {
    const api = useApi();
    const response = await api("/role-pulk-actions", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    return { data: response, error: null };
  } catch (error: unknown) {
    return { data: null, error: (error as { data?: unknown })?.data || error };
  }
};
