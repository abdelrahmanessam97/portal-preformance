// app/composables/auth/useResendPassword.ts
import { useApi } from "../useApi"

type CommonResponse = { status_code: number; message: string; data: unknown[] }

export const useResendPassoword = async (email: string) => {
  const api = useApi()
  try {
    const res = await api<CommonResponse>("/resend-password", {
      method: "POST",
      body: { email },
    })

    const secure =
      import.meta.client && typeof window !== "undefined"
        ? window.location.protocol === "https:"
        : false
    useCookie<string | null>("reset_email", {
      sameSite: "strict",
      secure,
      maxAge: 15 * 60,
    }).value = email

    if (import.meta.client) {
      localStorage.setItem("auth:lastResetEmail", email)
      localStorage.setItem("auth:lastResetAt", String(Date.now()))
    }

    return { data: res, error: null, status: res?.status_code ?? 200, pending: false }
  } catch (error: unknown) {
    return { data: null, error, status: 500, pending: false }
  }
}
