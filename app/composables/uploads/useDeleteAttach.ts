import { useApi } from "../useApi";

interface ApiDeleteAttachResponse {
  status_code: number;
  message: string;
}

export const useDeleteAttach = async (attachmentId: number) => {
  const api = useApi();
  try {
    const res = await api<ApiDeleteAttachResponse>(`/delete/${attachmentId}`, {
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
    const errMsg = (error as { data?: { message?: string }; message?: string })?.data?.message || (error as { message?: string })?.message || "Delete failed.";
    return {
      data: null,
      message: errMsg,
      error,
      status: (error as { statusCode?: number })?.statusCode ?? 500,
      pending: false,
    };
  }
};
