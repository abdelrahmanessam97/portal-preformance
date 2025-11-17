// composables/auth/useChangePassword.ts
import { useApi } from "../useApi"

type ChangePasswordResponse = {
  status_code?: number
  message?: string
}

type ErrorLike = {
  status?: number
  statusCode?: number
  data?: unknown
  response?: { _data?: unknown }
}

export const useChangePassword = async (
  oldPassword: string,
  password: string,
  confirmPassword: string
) => {
  const api = useApi()

  try {
    const res = await api<ChangePasswordResponse>("/change-password", {
      method: "POST",
      body: {
        old_password: oldPassword,
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
