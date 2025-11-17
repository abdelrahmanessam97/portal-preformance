import { useApi } from "@/composables/useApi";
import type { ApiListResponse, ComposableResult, NewsDTO, NewsItem } from "../../../types/news";
import { dtoToItem } from "./utils";

const base = "/news";

/** GET /news -> NewsItem[] */
export const useFetchNews = async (): Promise<ComposableResult<NewsItem[]>> => {
  const api = useApi();
  try {
    const res = await api<ApiListResponse<NewsDTO>>(base, { method: "GET" });
    const items = Array.isArray(res?.data) ? res.data.map(dtoToItem) : [];
    return { data: items, message: res?.message ?? "OK", error: null, status: res?.status_code ?? 200, pending: false };
  } catch (error: unknown) {
    const msg =
      (error as { data?: { message?: string }; message?: string })?.data?.message ||
      (error as { message?: string })?.message ||
      "Fetch failed.";
    return { data: null, message: msg, error, status: (error as { statusCode?: number })?.statusCode ?? 500, pending: false };
  }
};
