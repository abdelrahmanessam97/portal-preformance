import type { RecycleListResponse } from "~~/types/recycleBin";
import { useApi } from "../useApi";

export type ApiResult<D> = {
  data: D | null;
  error: unknown;
  status: number;
  pending: boolean;
};

export async function useRestoreChild(modelName: string, modelId: number): Promise<ApiResult<RecycleListResponse>> {
  const api = useApi();

  try {
    const res = await api<RecycleListResponse>("/recycle-bin/restore-child", {
      method: "POST",
      params: {
        model_name: modelName,
        model_id: modelId,
      },
    });

    if (!res || res.status_code !== 200) {
      throw new Error(res?.message || "Failed to restore document");
    }

    return { data: res, error: null, status: res.status_code, pending: false };
  } catch (error) {
    return { data: null, error, status: 500, pending: false };
  }
}
