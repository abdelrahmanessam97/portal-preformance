import { useApi } from "../useApi";
import type { FolderResponse } from "./../../../types/folder";

interface ApiUpdateFolderResponse {
  status_code: number;
  message: string;
  data: FolderResponse[];
}

export const useDeleteFolder = async (id: number) => {
  const api = useApi();
  try {
    const res = await api<ApiUpdateFolderResponse>(`/recycle-bin/delete?model_name=folder&model_id=${id}`, {
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
