import { useAsyncData } from "nuxt/app";
import { useApi } from "../useApi";

interface ApiNote {
  id: number;
  description: string;
  created_at: string;
}

interface ApiListResponse {
  status_code: number;
  message: string;
  data: ApiNote[];
}

export const useFetchNotes = () => {
  const api = useApi();

  const { data, pending, error, refresh } = useAsyncData(
    "notes",
    () => api<ApiListResponse>("/notes", { method: "GET" }),
    { server: true }
  );

  return { data, pending, error, refresh };
};
