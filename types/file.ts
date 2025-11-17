export type Attachment = {
  id: number;
  title: string;
  type: string;
  name: string;
  size: number;
  file: string;
  admins_has_access?: AdminAccess[];
  roles_has_access?: RoleAccess[];
};

export type AdminAccess = {
  id: number;
  name: string;
  role_id?: number;
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

export type FileResponse = {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  docs_count: number;
  folder_id: number;
  folder_title: string;
  category_id: number | null;
  doc_count: number;
  created_at: string;
  deleted_at: string | null;
  restored_by_children: boolean;
  admins_has_access?: AdminAccess[];
  roles_has_access?: RoleAccess[];
  attachments: Attachment[];
};

export type FilePayload = {
  en: { title: string; description: string };
  ar: { title: string; description: string };
  parent_id: number;
  attachments?: number[];
  admin_ids?: number[];
  role_ids?: number[];
};
