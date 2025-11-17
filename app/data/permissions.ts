// export const userColumns = [
//   { key: "id", label: "User ID" },
//   { key: "name", label: "Name" },
//   { key: "email", label: "Email" },
//   { key: "role", label: "Role" },
//   { key: "status", label: "Status" },
// ];

// export const roleColumns = [
//   { key: "id", label: "Role ID" },
//   { key: "name", label: "Role Name" },
//   { key: "permissions", label: "Permissions" },
//   { key: "users", label: "Users" },
// ];

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "نشط" | "غير نشط";
};

export type RoleDisplay = {
  id: string;
  name: string;
  permissions: number;
  users: number;
};
