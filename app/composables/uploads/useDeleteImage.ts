// composables/uploads/useDeleteImage.ts
import { useApi } from "@/composables/useApi";

export const useDeleteImage = async (id: number) => {
  const api = useApi();
  try {
    const res = await api<{ status_code: number; message: string; data: [] }>(`/delete/${id}`, { method: "DELETE" });
    return { data: res, error: null };
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; message?: string };
    const errMsg = error.data?.message ?? error.message ?? "Failed to delete image";
    return { data: null, error: errMsg };
  }
};
