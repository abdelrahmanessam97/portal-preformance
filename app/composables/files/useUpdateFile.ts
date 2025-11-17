// /app/composables/files/useUpdateFile.ts
import type { FilePayload, FileResponse } from "~~/types/file";
import { useApi } from "../useApi";

interface ApiUpdateFileResponse {
  status_code: number;
  message: string;
  data: FileResponse;
}

export const useUpdateFile = async (id: number, payload: FilePayload) => {
  const api = useApi();
  try {
    const res = await api<ApiUpdateFileResponse>(`/files/${id}`, {
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
