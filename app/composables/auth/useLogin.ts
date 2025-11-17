// composables/auth/useLogin.ts
import { useApi } from "../useApi"
import { useAuthStore, type User } from "@/stores/auth"

type LoginResponse = {
  status_code?: number
  data?: User
  message?: string
}

type ErrorLike = {
  status?: number
  statusCode?: number
  data?: unknown
  response?: { _data?: unknown }
}

export const useLogin = async (
  email: string,
  password: string,
  remember = false
) => {
  const api = useApi()
  const auth = useAuthStore()

  try {
    const body = { email, password }
    const res = await api<LoginResponse>("/login", { method: "POST", body })

    if (res?.data?.access_token) {
      auth.setSession(res.data, res.data.access_token, remember)
    }

    return {
      data: res,
      error: null,
      status: res?.status_code ?? 200,
      pending: false,
    }
  } catch (error: unknown) {
    const e = error as ErrorLike
    const errorData = e.data ?? e.response?._data ?? e
    
    // Check for 403 status with account not verified message
    if (e.status === 403 || e.statusCode === 403) {
      const errorMessage = (errorData as { message?: string })?.message
      if (errorMessage === "User account not verified") {
        return {
          data: null,
          error: errorData,
          status: 403,
          pending: false,
          needsVerification: true,
        }
      }
    }

    return {
      data: null,
      error: errorData,
      status: e.status ?? e.statusCode ?? 500,
      pending: false,
    }
  }
}
