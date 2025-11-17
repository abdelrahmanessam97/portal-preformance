import { useApi } from "../useApi";

interface ApiDownloadAttachResponse {
  status_code: number;
  message: string;
  data: {
    id: number;
    title: string;
    type: string;
    name: string;
    size: number;
    file: string;
    admins_has_access: unknown[];
    roles_has_access: unknown[];
  };
}

export const useDownloadAttach = async (attachmentId: number) => {
  const api = useApi();
  try {
    const res = await api<ApiDownloadAttachResponse>(`/show/${attachmentId}`, {
      method: "GET",
    });
    return {
      data: {
        url: res?.data?.file ?? "",
        filename: res?.data?.title ?? res?.data?.name ?? `attachment_${attachmentId}`,
      },
      message: res?.message ?? "Download ready.",
      error: null,
      status: res?.status_code ?? 200,
      pending: false,
    };
  } catch (error: unknown) {
    const errMsg = (error as { data?: { message?: string }; message?: string })?.data?.message || (error as { message?: string })?.message || "Download failed.";
    return {
      data: null,
      message: errMsg,
      error,
      status: (error as { statusCode?: number })?.statusCode ?? 500,
      pending: false,
    };
  }
};
