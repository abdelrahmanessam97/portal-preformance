// app/composables/auth/useForgotPassword.ts
import { useApi } from "../useApi"

type CommonResponse = { status_code: number; message: string; data: unknown[] }

export const useForgotPassword = async (email: string) => {
  const api = useApi()
  try {
    const res = await api<CommonResponse>("/forgot-password", {
      method: "POST",
      body: { email },
    })

    // remember email for confirm step (cookie + optional localStorage)
    const secure =
      import.meta.client && typeof window !== "undefined"
        ? window.location.protocol === "https:"
        : false
    useCookie<string | null>("reset_email", {
      sameSite: "strict",
      secure,
      maxAge: 15 * 60, // 15 minutes is enough for the flow
    }).value = email

    if (import.meta.client) {
      localStorage.setItem("auth:lastResetEmail", email)
      localStorage.setItem("auth:lastResetAt", String(Date.now()))
    }

    return { data: res, error: null, status: res?.status_code ?? 200, pending: false }
  } catch (error: unknown) {
    // Handle $fetch error structure
    if (error && typeof error === 'object') {
      // Check if it's a $fetch error with data property containing the API response
      if ('data' in error && error.data && typeof error.data === 'object') {
        const errorData = error.data as { status_code?: number; message?: string };
        if (errorData.status_code && errorData.message) {
          return { 
            data: null, 
            error: { status_code: errorData.status_code, message: errorData.message }, 
            status: errorData.status_code, 
            pending: false 
          }
        }
      }
      
      // Check if it's a direct API error response
      if ('status_code' in error && 'message' in error) {
        const apiError = error as { status_code: number; message: string };
        return { data: null, error: apiError, status: apiError.status_code, pending: false }
      }
      
      // Check if it's a $fetch error with response property
      if ('response' in error && error.response && typeof error.response === 'object') {
        const response = error.response as { _data?: { status_code?: number; message?: string } };
        if (response._data?.status_code && response._data?.message) {
          return { 
            data: null, 
            error: { status_code: response._data.status_code, message: response._data.message }, 
            status: response._data.status_code, 
            pending: false 
          }
        }
      }
    }
    
    // Fallback for unknown error structure
    return { data: null, error, status: 500, pending: false }
  }
}
