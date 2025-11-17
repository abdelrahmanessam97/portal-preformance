export type AdminCreatePayload = {
  name: string;
  email: string;
  role?: string | "";
};

export type AdminApiResponse = {
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    role?: string | "";
    status: "Active" | "Inactive";
    access_token: string;
  };
};

export type AdminsListResponse = {
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    role?: string | "";
    status: "Active" | "Inactive";
    access_token: string | null;
    permissions: unknown[];
  }[];
  meta: {
    current_page: number;
    total: number;
    per_page: number;
  };
};

export type AdminModel = {
  id: number;
  name: string;
  email: string;
  status: "Active" | "Inactive";
  accessToken?: string;
  role?: string | "";
  deleted?: boolean;
};

export type UpdatePayload = {
  name?: string;
  email?: string;
  status?: "Active" | "Inactive";
  role?: string;
  role_id?: number;
};
