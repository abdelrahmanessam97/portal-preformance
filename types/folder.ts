export type FolderPayload = {
  en: { title: string; description?: string };
  ar: { title: string; description?: string };
  category_id: number;
  admin_ids?: number[];
  role_ids?: number[];
};

export type FolderResponse = {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  category_id?: number;
  file_count: number;
  created_at: string;
  deleted_at: string | null;
  restored_by_children: boolean | null;
};
