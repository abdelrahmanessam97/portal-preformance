// /app/composables/files/useAccessibilityUpdate.ts
import type { Attachment } from "~~/types/file";
import { useApi } from "../useApi";

interface ApiAccessibilityUpdateResponse {
  status_code: number;
  message: string;
  data: Attachment;
}

interface AttachmentPayload {
  role_ids?: number[];
  admin_ids?: number[];
  title?: string;
}

export const useAccessibilityUpdate = async (id: number, payload: AttachmentPayload) => {
  const api = useApi();
  try {
    // Create FormData for each request to avoid reusing the same instance
    const formData = new FormData();

    // Always send role_ids (even if empty to clear)
    const roleIds = payload.role_ids || [];
    roleIds.forEach((roleId, index) => {
      formData.append(`role_ids[${index}]`, roleId.toString());
    });

    // Always send admin_ids (even if empty to clear)
    const adminIds = payload.admin_ids || [];
    adminIds.forEach((adminId, index) => {
      formData.append(`admin_ids[${index}]`, adminId.toString());
    });

    // Send title if provided
    if (payload.title) {
      formData.append("title", payload.title);
    }

    const res = await api<ApiAccessibilityUpdateResponse>(`/attachments/${id}/accessibility/update`, {
      method: "POST",
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
