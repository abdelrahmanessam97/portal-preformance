// app/composables/notes/useUpdateNote.ts
import { useApi } from "../useApi"
import { navigateTo, useCookie } from "#imports"

export type ApiOkResponse = { status_code: number; message: string; data: unknown[] }
export type ApiResult<D> = { data: D | null; error: unknown; status: number; pending: boolean }

const getToken = () =>
  useCookie<string | null>("access_token").value ??
  useCookie<string | null>("token").value ??
  useCookie<string | null>("auth_token").value ?? null

const ensureAuth = async () => {
  const t = getToken()
  if (!t) {
    await navigateTo("/auth/login")
    throw new Error("Not authenticated")
  }
  return t
}

export async function useUpdateNote(id: number, description: string): Promise<ApiResult<ApiOkResponse>> {
  const api = useApi()
  await ensureAuth()
  try {
    const res = await api<ApiOkResponse>(`/notes/${id}`, { method: "PATCH", body: { description } })
    return { data: res, error: null, status: res?.status_code ?? 200, pending: false }
  } catch (error) {
    return { data: null, error, status: 500, pending: false }
  }
}
