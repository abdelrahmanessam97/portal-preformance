import { useApi } from "../useApi"
import { useAuthStore } from "~/stores/auth"

type LogoutResponse = {
  status_code: number
  message: string
  data: unknown[]
}

export const useLogout = async () => {
  const api = useApi()
  const auth = useAuthStore()

  try {
    const res = await api<LogoutResponse>("/logout", { method: "POST" })

    auth.clearSession()

    return {
      data: res,
      error: null,
      status: res.status_code,
      pending: false,
    }
  } catch (error: unknown) {
    auth.clearSession()
    return {
      data: null,
      error,
      status: 500,
      pending: false,
    }
  }
}
