import { useApi } from "~/composables/useApi";
import type { AdminApiResponse, UpdatePayload } from "~~/types/admin";

export const useUpdateAdmin = async (id: string | number, payload: UpdatePayload) => {
  const api = useApi();
  try {
    const res = await api<AdminApiResponse>(`/admins/${id}`, {
      method: "PUT",
      body: payload,
    });
    return {
      data: res,
      message: res?.message ?? "Updated successfully.",
      error: null,
      status: res?.status_code ?? 200,
      pending: false,
    };
  } catch (error: unknown) {
    const errMsg = (error as { data?: { message?: string }; message?: string })?.data?.message || (error as { message?: string })?.message || "Update failed.";
    return {
      data: null,
      message: errMsg,
      error,
      status: (error as { statusCode?: number })?.statusCode ?? 500,
      pending: false,
    };
  }
};
