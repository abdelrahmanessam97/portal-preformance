import { useApi } from "@/composables/useApi";
import type { ApiItemResponse, ComposableResult, NewsDTO, NewsItem, UpdateNewsPayload } from "../../../types/news";
import { dtoToItem } from "./utils";

const base = "/news";

/** PATCH /news/:id -> NewsItem */
export const useUpdate = async (id: number, payload: UpdateNewsPayload): Promise<ComposableResult<NewsItem>> => {
  const api = useApi();
  try {
    const res = await api<ApiItemResponse<NewsDTO>>(`${base}/${id}`, { method: "PATCH", body: payload });
    return { data: dtoToItem(res.data), message: res?.message ?? "Updated successfully.", error: null, status: res?.status_code ?? 200, pending: false };
  } catch (error: unknown) {
    const msg =
      (error as { data?: { message?: string }; message?: string })?.data?.message ||
      (error as { message?: string })?.message ||
      "Update failed.";
    return { data: null, message: msg, error, status: (error as { statusCode?: number })?.statusCode ?? 500, pending: false };
  }
};
