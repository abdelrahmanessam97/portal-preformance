export type CategoryResponse = {
  id: number;
  title?: string;
  title_ar?: string;
  title_en?: string;
  folder_count: number;
};

export type AdminAccess = {
  id: number;
  name: string;
};

export type Permission = {
  id: number;
  title: string;
};

export type RoleAccess = {
  id: number;
  name: string;
  count_users: number;
  count_permission: number;
  permissions: Permission[];
};

export type FolderResponse = {
  id: number;
  title?: string;
  title_ar?: string;
  title_en?: string;
  category_id: number;
  category_title: string;
  parent_id: number | null;
  folder_title: string | null;
  file_count: number;
  created_at: string;
  deleted_at: string | null;
  restored_by_children: boolean;
};

export type SingleCategoryResponse = {
  id: number;
  title?: string;
  title_ar?: string;
  title_en?: string;
  folders: FolderResponse[];
  admins_has_access?: AdminAccess[];
  roles_has_access?: RoleAccess[];
};

export type CreateCategoryResponse = {
  id: number;
  title?: string;
  title_ar?: string;
  title_en?: string;
  folder_count: number;
};

export type UpdateCategoryResponse = {
  id: number;
  title?: string;
  title_ar?: string;
  title_en?: string;
  folder_count: number;
};

export interface CategoryPayload {
  en: { title: string };
  ar: { title: string };
  admin_ids?: number[];
  role_ids?: number[];
}
