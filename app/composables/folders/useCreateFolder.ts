// app/composables/folders/useCreateFolder.ts
import { useApi } from "../useApi";
import type { FolderPayload, FolderResponse } from "./../../../types/folder";

interface ApiCreateFolderResponse {
  status_code: number;
  message: string;
  data: FolderResponse[];
}

export const useCreateFolder = async (payload: FolderPayload) => {
  const api = useApi();
  try {
    const res = await api<ApiCreateFolderResponse>("/folders", {
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
