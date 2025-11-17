// composables/notes/useDeleteNote.ts
import { useApi } from "../useApi"

type ApiOk = { status_code: number; message: string; data: unknown[] }

export const useDeleteNote = async (id: number) => {
  const api = useApi()
  try {
    const res = await api<ApiOk>(`/notes/${id}`, { method: "DELETE" })
    return { data: res, message: res?.message ?? "Deleted successfully.", error: null, status: res?.status_code ?? 200, pending: false }
  } catch (error: unknown) {
    return { data: null, message: "Delete failed.", error, status: 500, pending: false }
  }
}
