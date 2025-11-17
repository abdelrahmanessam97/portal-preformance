// app/composables/reminders/useRemindersFetch.ts
import { useApi } from "@/composables/useApi";

export type ApiTask = { id: number; description: string; is_checked: boolean };
export type ApiReminder = { id: number; admin_id: number; date: string; tasks: ApiTask[] };
export type Task = { id?: number; description: string; status: 1 | 2 };
export type ByDate = Record<string, Task[]>;

type ApiListResponse = {
  status_code: number;
  message: string;
  data: ApiReminder[];
};

const mapApiToByDate = (data: ApiReminder[] = []): ByDate => {
  const out: ByDate = {};
  for (const r of data) {
    out[r.date] = (r.tasks || []).map((t) => ({
      id: t.id,
      description: t.description,
      status: t.is_checked ? 1 : 2,
    }));
  }
  return out;
};

export const useRemindersFetch = () => {
  const api = useApi();
  const { data, pending, error, refresh } = useAsyncData<ByDate>("reminders", async () => {
    const res = await api<ApiListResponse>("/reminders", { method: "GET" });
    return mapApiToByDate(res?.data ?? []);
  });

  return {
    reminders: data,
    fetchReminders: refresh,
    pending,
    error
  };
};