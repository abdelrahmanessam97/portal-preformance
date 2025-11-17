import { useApi } from "@/composables/useApi";
import type { ApiItemResponse, ComposableResult, CreateNewsPayload, NewsDTO, NewsItem } from "../../../types/news";
import { dtoToItem } from "./utils";

const base = "/news";

/** POST /news -> NewsItem */
export const useCreate = async (payload: CreateNewsPayload): Promise<ComposableResult<NewsItem>> => {
  const api = useApi();
  try {
    const res = await api<ApiItemResponse<NewsDTO>>(base, { method: "POST", body: payload });
    return { data: dtoToItem(res.data), message: res?.message ?? "Created successfully.", error: null, status: res?.status_code ?? 200, pending: false };
  } catch (error: unknown) {
    const msg =
      (error as { data?: { message?: string }; message?: string })?.data?.message ||
      (error as { message?: string })?.message ||
      "Create failed.";
    return { data: null, message: msg, error, status: (error as { statusCode?: number })?.statusCode ?? 500, pending: false };
  }
};
