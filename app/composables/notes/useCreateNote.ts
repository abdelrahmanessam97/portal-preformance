// composables/notes/useCreateNote.ts
import { useApi } from "../useApi"

type ApiOk = { status_code: number; message: string; data: unknown[] }
type ApiError = { status_code: number; message: string }

export const useCreateNote = async (description: string) => {
  const api = useApi()
  try {
    const res = await api<ApiOk>("/notes", {
      method: "POST",
      body: { description },
    })
    return { data: res, message: res?.message ?? "Created successfully.", error: null, status: res?.status_code ?? 200, pending: false }
  } catch (error: unknown) {
    // Extract backend error message from $fetch error structure
    const msg =
      (error as { data?: { message?: string }; message?: string })?.data?.message ||
      (error as { message?: string })?.message ||
      "Failed to create note. Please try again.";
    const status = (error as { statusCode?: number })?.statusCode ?? 500;
    
    return { 
      data: null, 
      message: msg, 
      error, 
      status, 
      pending: false 
    }
  }
}
