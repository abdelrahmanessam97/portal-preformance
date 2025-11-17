import  type { useApi } from "@/composables/useApi";

/** Server attachments DTO */
export interface Attachment {
  id: number;
  title: string;
  type: string;
  name: string;
  size: number;
  file: string;
}

/** Server News DTO */
export interface NewsDTO {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  description: string;
  description_ar: string;
  description_en: string;
  attachments?: Attachment[];
  created_at: string;
}

/** Create/Update payloads */
export interface CreateNewsPayload {
  en: { title: string; description: string };
  ar: { title: string; description: string };
  attachments?: number[];
}
export type UpdateNewsPayload = CreateNewsPayload;

/** Mapped client item */
export interface NewsItem {
  id: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  images: string[];
  attachmentIds?: number[];
  author: string;
  date: string;
  time: string;
}

/** Common API response wrapper (typed per endpoint) */
export interface ApiListResponse<T> {
  status_code: number;
  message: string;
  data: T[];
}
export interface ApiItemResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

/** Small helper so each composable returns a consistent shape like your other composables */
export type ComposableResult<T> = {
  data: T | null;
  message: string;
  error: unknown | null;
  status: number;
  pending: boolean;
};

/** Re-export useApi type helper if needed elsewhere */
export type UseApi = ReturnType<typeof useApi>;
