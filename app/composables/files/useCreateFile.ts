import type { FilePayload, FileResponse } from "~~/types/file";
import { useApi } from "../useApi";

interface ApiCreateFileResponse {
  status_code: number;
  message: string;
  data: FileResponse[];
}

export const useCreateFile = async (payload: FilePayload) => {
  const api = useApi();
  try {
    const res = await api<ApiCreateFileResponse>("/files", {
      method: "POST",
      body: payload,
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
