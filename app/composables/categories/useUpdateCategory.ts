import type { CategoryPayload, UpdateCategoryResponse } from "~~/types/category";
import { useApi } from "../useApi";

interface ApiUpdateCategoryResponse {
  status_code: number;
  message: string;
  data: UpdateCategoryResponse[];
}

export const useUpdateCategory = async (id: number, payload: CategoryPayload) => {
  const api = useApi();
  try {
    const res = await api<ApiUpdateCategoryResponse>(`/categories/${id}`, {
      method: "PATCH",
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
