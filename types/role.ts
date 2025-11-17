export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface Permission {
  id: number;
  name: string;
  checked: boolean;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface RoleApiResponse {
  status_code: number;
  message: string;
  data: Role[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface RoleFormData {
  name: string;
  permissions: string[];
}

export interface RoleUpdateData {
  name: string;
  permissions: string[];
}

// For the permissions page display
export interface RoleDisplay {
  id: string;
  name: string;
  permissions: number;
  users: number;
}

// For editing forms
export interface EditingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}

export interface EditingRole {
  id: string;
  name: string;
  permissions: number;
  users: number;
  permissionsGroups?: PermissionGroup[];
}

export interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

// Error type
export interface ApiError {
  message?: string;
  data?: unknown;
}

// Assign role to admins request body
export interface AssignRoleFormData {
  role_id: number;
  admin_ids: number[];
}
