import { useApi } from "@/composables/useApi";
import type { ComposableResult } from "../../../types/news";

const base = "/news";

/** DELETE /news/:id */
export const useDelete = async (id: number): Promise<ComposableResult<true>> => {
  const api = useApi();
  try {
    const res = await api<{ status_code: number; message: string; data: [] }>(`${base}/${id}`, { method: "DELETE" });
    return { data: true, message: res?.message ?? "Deleted successfully.", error: null, status: res?.status_code ?? 200, pending: false };
  } catch (error: unknown) {
    const msg =
      (error as { data?: { message?: string }; message?: string })?.data?.message ||
      (error as { message?: string })?.message ||
      "Delete failed.";
    return { data: null, message: msg, error, status: (error as { statusCode?: number })?.statusCode ?? 500, pending: false } as unknown as ComposableResult<true>;
  }
};
