// app/composables/reminders/useRemindersPost.ts
import { useApi } from "@/composables/useApi";

type CreateResponse = { status_code?: number; message?: string; data?: unknown };
type ErrorResponse = { status_code?: number; message: string };

interface HttpError {
  data?: { status_code?: number; message?: string };
  status?: number;
  statusCode?: number;
  message?: string;
  response?: unknown;
}

export const useRemindersPost = () => {
  const api = useApi();

  return {
    async createReminder(date: string, description: string): Promise<CreateResponse | ErrorResponse> {
      try {
        const res = await api<CreateResponse>("/reminders", {
          method: "POST",
          body: { date, description },
        });

        // Return the response as-is from API
        return res ?? { status_code: 200, message: "Success" };
      } catch (error: unknown) {
        const errorMessage = error as { message?: string } | null;
        const httpError = error as HttpError;

        // Check if it's an HTTP error with response data
        if (httpError?.data && typeof httpError.data === "object") {
          // If the error has data with status_code and message, return it
          if ("status_code" in httpError.data && "message" in httpError.data) {
            return {
              status_code: httpError.data.status_code,
              message: httpError.data.message,
            };
          }
        }

        // Check if error has status_code and message directly
        if (error && typeof error === "object" && "status_code" in error && "message" in error) {
          return error as ErrorResponse;
        }

        // For network errors or other issues, return generic error
        return {
          status_code: 500,
          message: errorMessage?.message || "Unknown error occurred",
        };
      }
    },
  };
};
