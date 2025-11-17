// stores/auth.ts
import { defineStore } from "pinia"
 
interface Permission {
  id: number
  title: string
}
 
export interface User {
  id: number
  name: string
  email: string
  status: string
  access_token: string
  avatar?: string
  role_id: number
  role_name: string
  permissions: Permission[]
}
 
interface AuthState {
  user: User | null
  token: string | null
}
 
export const useAuthStore = defineStore("auth", {
  state: (): AuthState => {
    const token = useCookie<string | null>("token").value
    const user = useCookie<User | null>("user").value
    return { user: user ?? null, token: token ?? null }
  },
 
  getters: {
    isAuthenticated: (s) => !!s.token,
    me: (s) => s.user,
    userPermissions: (s) => s.user?.permissions || [],
    permissionTitles: (s) => s.user?.permissions?.map((p) => p.title) || [],
    userInitials: (s) => {
      if (!s.user?.name) return "US"
      const names = s.user.name.split(" ")
      if (names.length >= 2 && names[0] && names[1]) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      if (names[0] && names[0].length >= 2) {
        return names[0].substring(0, 2).toUpperCase()
      }
      return "US"
    },
  },
 
  actions: {
    setSession(user: User, token: string, remember = false) {
      this.user = user
      this.token = token
 
      const secure =
        import.meta.client && typeof window !== "undefined"
          ? window.location.protocol === "https:"
          : false
 
      const cookieOptions = {
        sameSite: "strict" as const,
        secure,
        maxAge: remember ? 60 * 60 * 24 * 30 : undefined,
      }
 
      useCookie<string | null>("token", cookieOptions).value = token
      useCookie<User | null>("user", cookieOptions).value = user
    },
 
    clearSession() {
      this.user = null
      this.token = null
      useCookie<string | null>("token").value = null
      useCookie<User | null>("user").value = null
    },
 
    // ======================
    // Permission Methods
    // ======================
    hasPermission(permission: string): boolean {
      return this.permissionTitles.includes(permission)
    },
 
    hasAnyPermission(permissions: string[]): boolean {
      return permissions.some((permission) => this.hasPermission(permission))
    },
 
    hasAllPermissions(permissions: string[]): boolean {
      return permissions.every((permission) => this.hasPermission(permission))
    },
 
    canCreate(resource: string): boolean {
      return this.hasPermission(`${resource}-create`)
    },
 
    canRead(resource: string): boolean {
      return this.hasPermission(`${resource}-read`)
    },
 
    canUpdate(resource: string): boolean {
      return this.hasPermission(`${resource}-update`)
    },
 
    canDelete(resource: string): boolean {
      return this.hasPermission(`${resource}-delete`)
    },
 
    canManage(resource: string): boolean {
      return this.hasPermission(`${resource}-manage`)
    },
 
    canSend(resource: string): boolean {
      return this.hasPermission(`${resource}-send`)
    },
 
    canExport(resource: string): boolean {
      return this.hasPermission(`${resource}-export`)
    },
  },
 
})