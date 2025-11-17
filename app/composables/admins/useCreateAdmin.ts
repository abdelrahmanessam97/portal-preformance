import { useApi } from "~/composables/useApi";
import type { AdminApiResponse } from "~~/types/admin";

export const useCreateAdmin = async (name: string, email: string, role_id: number) => {
  const api = useApi();
  try {
    const res = await api<AdminApiResponse>("/admins", {
      method: "POST",
      body: { name, email, role_id },
    });
    return {
      data: res,
      message: res?.message ?? "Created successfully.",
      error: null,
      status: res?.status_code ?? 200,
      pending: false,
    };
  } catch (error: unknown) {
    const errMsg = (error as { data?: { message?: string }; message?: string })?.data?.message || (error as { message?: string })?.message || "Create failed.";
    return {
      data: null,
      message: errMsg,
      error,
      status: (error as { statusCode?: number })?.statusCode ?? 500,
      pending: false,
    };
  }
};
