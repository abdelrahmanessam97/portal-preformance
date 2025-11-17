// composables/uploads/useUpload.ts
import { useApi } from "@/composables/useApi";
import type { AdminAccess, RoleAccess } from "~~/types/file";

export interface UploadResponse {
  status_code: number;
  message: string;
  data: {
    id: number;
    title: string;
    type: string;
    name: string;
    size: number;
    file: string;
    admins_has_access: AdminAccess[];
    roles_has_access: RoleAccess[];
  };
}

export async function useUpload(
  file: File,
  title?: string,
  type: "file" | "image" | "video" = "file",
  admin_ids?: number[],
  role_ids?: number[]
): Promise<{ data: UploadResponse | null; error: string | null }> {
  const api = useApi();

  const formData = new FormData();
  const documentTitle = title || file.name || "Untitled Document";

  // Ensure title is not empty or undefined
  if (!documentTitle || documentTitle.trim() === "") {
    throw new Error("Title is required and cannot be empty");
  }

  // Use different field names based on type
  if (type === "image") {
    formData.append("image", file);
  } else {
    formData.append("file", file);
  }

  formData.append("title", documentTitle.trim());
  formData.append("name", documentTitle.trim()); // Try both title and name
  formData.append("type", type);
  formData.append("size", file.size.toString());

  // Append arrays properly for FormData
  if (admin_ids && admin_ids.length > 0) {
    admin_ids.forEach((id) => {
      formData.append("admin_ids[]", id.toString());
    });
  }

  if (role_ids && role_ids.length > 0) {
    role_ids.forEach((id) => {
      formData.append("role_ids[]", id.toString());
    });
  }

  try {
    const res = await api<UploadResponse>("/upload", {
      method: "POST",
      body: formData,
    });

    if (!res || res.status_code !== 200) {
      const errorMessage = res as { message?: string } | null;
      throw new Error(errorMessage?.message || "Upload failed");
    }
    return { data: res, error: null };
  } catch (err: unknown) {
    // Extract error message from API response
    let errorMessage: string | null = null;

    // Helper function to extract error from error data
    const extractErrorFromData = (errorData: { message?: string; errors?: Record<string, string[]>; status_code?: number } | null) => {
      if (!errorData) return null;

      // Check for validation errors (e.g., errors.image)
      if (errorData.errors) {
        // Try to get image field error first (for image uploads)
        if (type === "image" && errorData.errors.image && Array.isArray(errorData.errors.image) && errorData.errors.image.length > 0) {
          return errorData.errors.image[0] || null;
        } else if (errorData.errors.file && Array.isArray(errorData.errors.file) && errorData.errors.file.length > 0) {
          return errorData.errors.file[0] || null;
        } else {
          // Get first error from any field
          const firstErrorKey = Object.keys(errorData.errors)[0];
          if (firstErrorKey && Array.isArray(errorData.errors[firstErrorKey]) && errorData.errors[firstErrorKey].length > 0) {
            return errorData.errors[firstErrorKey][0] || null;
          }
        }
      }

      // Fall back to message if no validation errors found
      return errorData.message || null;
    };

    // Handle $fetch error with data property (API response)
    if (err && typeof err === "object" && "data" in err) {
      const errorData = err.data as { message?: string; errors?: Record<string, string[]>; status_code?: number } | null;
      errorMessage = extractErrorFromData(errorData);
    }

    // Handle $fetch error with response._data (alternative structure)
    if (!errorMessage && err && typeof err === "object" && "response" in err) {
      const response = (err as { response?: { _data?: { message?: string; errors?: Record<string, string[]> } } }).response;
      if (response?._data) {
        errorMessage = extractErrorFromData(response._data);
      }
    }

    // Handle direct Error objects
    if (!errorMessage && err instanceof Error) {
      errorMessage = err.message;
    }

    // Handle objects with message property
    if (!errorMessage && err && typeof err === "object" && "message" in err) {
      errorMessage = (err as { message?: string }).message || null;
    }

    return { data: null, error: errorMessage || "Upload failed" };
  }
}
