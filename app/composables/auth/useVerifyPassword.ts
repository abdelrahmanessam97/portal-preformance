// app/composables/auth/useVerifyPassword.ts
import { useApi } from "../useApi"

type VerifyResponse = {
  status_code?: number
  message?: string
  data?: unknown
}

type ErrorLike = {
  status?: number
  statusCode?: number
  data?: unknown
  response?: { _data?: unknown }
}

export const useVerifyPassword = async (
  email: string,
  password: string,
  confirmPassword: string
) => {
  const api = useApi()
  try {
    const res = await api<VerifyResponse>("/verify-password", {
      method: "POST",
      body: {
        email,
        password,
        password_confirmation: confirmPassword,
      },
    })

    return {
      data: res,
      error: null,
      status: res?.status_code ?? 200,
      pending: false,
    }
  } catch (error: unknown) {
    const e = error as ErrorLike
    return {
      data: null,
      error: e.data ?? e.response?._data ?? e,
      status: e.status ?? e.statusCode ?? 500,
      pending: false,
    }
  }
}
