import type { FileResponse } from "~~/types/file";
import { useApi } from "../useApi";

interface ApiDeleteFileResponse {
  status_code: number;
  message: string;
  data: FileResponse[];
}

export const useDeleteFile = async (id: number) => {
  const api = useApi();
  try {
    const res = await api<ApiDeleteFileResponse>(`/recycle-bin/delete?model_name=file&model_id=${id}`, {
      method: "DELETE",
    });
    return {
      data: res,
      message: res?.message ?? "Deleted successfully.",
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
