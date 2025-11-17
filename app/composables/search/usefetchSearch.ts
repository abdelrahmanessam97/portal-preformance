import { useApi } from "../useApi";
import type { SearchResponse } from "./../../../types/search";

export const searchByKey = async (search: string) => {
  const api = useApi();

  if (!search.trim()) {
    return {
      data: { categories: [], folders: [], files: [], attachments: [] },
      message: "empty search",
      error: null,
      status: 200,
      pending: false,
      hasResults: false,
    };
  }

  try {
    const res = await api<SearchResponse>("/search", {
      method: "POST",
      body: { search },
    });

    if (!res || res.status_code !== 200 || !res.data?.results) {
      return {
        data: null,
        message: res?.message || "search failed",
        error: true,
        status: res?.status_code ?? 500,
        pending: false,
        hasResults: false,
      };
    }

    const {
      results: { categories, folders, files, attachments },
      total_results,
      search_query,
    } = res.data;

    const data = {
      query: search_query,
      total: total_results,
      categories: categories.data.map((c) => ({ id: c.id, title: c.title })),
      folders: folders.data.map((f) => ({ id: f.id, title: f.title })),
      files: files.data.map((f) => ({ id: f.id, title: f.title })),
      attachments: attachments.data.map((a) => ({
        id: a.id,
        file_id: a.file_id,
        title: a.title,
        file: a.file,
        size: a.size,
        createdAt: a.created_at,
      })),
    };

    // Check if we have any results
    const hasResults = data.categories.length > 0 || data.folders.length > 0 || data.files.length > 0 || data.attachments.length > 0;

    return {
      data,
      message: res.message,
      error: null,
      status: res.status_code,
      pending: false,
      hasResults,
    };
  } catch (error: unknown) {
    return {
      data: null,
      message: "search failed",
      error,
      status: 500,
      pending: false,
      hasResults: false,
    };
  }
};
