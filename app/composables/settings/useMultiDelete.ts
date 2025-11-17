// app/composables/settings/useMultiDelete.ts
import { useApi } from "@/composables/useApi";

export interface MultiDeletePayload {
  model_name: string; // "Task"
  ids: number[];
}

export const useMultiDelete = async (payload: MultiDeletePayload) => {
  const api = useApi();

  try {
    const res = await api<{ status_code: number; message: string; data: unknown[] }>(
      "/multi-delete",
      { method: "POST", body: payload }
    );
    return {
      data: res,
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error };
  }
};