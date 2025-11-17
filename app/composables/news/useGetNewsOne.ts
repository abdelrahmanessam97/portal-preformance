import { useApi } from "@/composables/useApi";
import type { ApiItemResponse, ComposableResult, NewsDTO, NewsItem } from "../../../types/news";
import { dtoToItem } from "./utils";

const base = "/news";

/** GET /news/:id -> NewsItem */
export const useGetNewsOne = async (id: number): Promise<ComposableResult<NewsItem>> => {
  const api = useApi();
  try {
    const res = await api<ApiItemResponse<NewsDTO>>(`${base}/${id}`, { method: "GET" });
    return { data: dtoToItem(res.data), message: res?.message ?? "OK", error: null, status: res?.status_code ?? 200, pending: false };
  } catch (error: unknown) {
    const msg =
      (error as { data?: { message?: string }; message?: string })?.data?.message ||
      (error as { message?: string })?.message ||
      "Fetch failed.";
    return { data: null, message: msg, error, status: (error as { statusCode?: number })?.statusCode ?? 500, pending: false };
  }
};
