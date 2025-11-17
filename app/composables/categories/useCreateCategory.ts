import type { CategoryPayload, CreateCategoryResponse } from "~~/types/category";
import { useApi } from "../useApi";

interface ApiCreateCategoryResponse {
  status_code: number;
  message: string;
  data: CreateCategoryResponse[];
}

export const useCreateCategory = async (payload: CategoryPayload) => {
  const api = useApi();
  try {
    const res = await api<ApiCreateCategoryResponse>("/categories", {
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
