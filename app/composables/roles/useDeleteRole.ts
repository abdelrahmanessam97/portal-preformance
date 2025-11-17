import { useApi } from "~/composables/useApi";

export const useDeleteRole = async (roleId: number) => {
  try {
    const api = useApi();
    const response = await api(`/roles/${roleId}`, {
      method: "DELETE",
    });

    return { data: response, error: null };
  } catch (error: unknown) {
    const errorData = error as { data?: unknown; message?: string };
    return { data: null, error: errorData.data || error };
  }
};
