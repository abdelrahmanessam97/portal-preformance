// app/composables/settings/useChangeStatus.ts
import { useApi } from "@/composables/useApi";

export interface ChangeStatusPayload {
  model_name: string; // "Task"
  model_id: number;
  status: 1 | 2;
}

/**
 * Check if status is inactive (handles both English and Arabic)
 * @param status - Status value ("Active", "Inactive", "نشط", "غير نشط")
 * @returns true if status is inactive
 */
export const isInactiveStatus = (status: string): boolean => {
  return status === "Inactive" || status === "غير نشط";
};

/**
 * Map status value to API status code
 * @param status - Status value ("Active", "Inactive", "نشط", "غير نشط")
 * @returns 1 for Active/نشط, 2 for Inactive/غير نشط
 */
export const getStatusCode = (status: string): 1 | 2 => {
  if (status === "Active" || status === "نشط") return 1;
  if (status === "Inactive" || status === "غير نشط") return 2;
  return 2; // default to inactive
};

export const useChangeStatus = async (payload: ChangeStatusPayload) => {
  const api = useApi();

  try {
    const res = await api<{ status_code: number; message: string; data: unknown[] }>("/status-change", { method: "POST", body: payload });
    return {
      data: res,
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error };
  }
};
