import type { FolderPayload, FolderResponse } from "./../../../types/folder";

import { useApi } from "../useApi";

interface ApiUpdateFolderResponse {
  status_code: number;
  message: string;
  data: FolderResponse[];
}

export const useUpdateFolder = async (id: number, payload: FolderPayload) => {
  const api = useApi();
  try {
    const res = await api<ApiUpdateFolderResponse>(`/folders/${id}`, {
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
