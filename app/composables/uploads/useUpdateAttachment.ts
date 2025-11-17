import { useApi } from "../useApi";

interface ApiUpdateAttachmentResponse {
  status_code: number;
  message: string;
  data: {
    id: number;
    title: string;
    type: string;
    name: string;
    size: number;
    file: string;
    admins_has_access?: unknown[];
    roles_has_access?: unknown[];
  };
}

export const useUpdateAttachment = async (attachmentId: number, title: string) => {
  const api = useApi();
  try {
    const formData = new FormData();
    formData.append("title", title);

    const res = await api<ApiUpdateAttachmentResponse>(`/attachments/${attachmentId}`, {
      method: "PUT",
      body: formData,
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

