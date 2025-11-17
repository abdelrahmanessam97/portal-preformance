<!-- app/pages/files/[Id]/index.vue -->
<script setup lang="ts">
import { navigateTo } from "#app";
import { useLocalePath } from "#i18n";
import AccessibilityDialog from "@/components/global/AccessibilityDialog.vue";
import DeleteItemDialog from "@/components/global/DeleteItemDialog.vue";
import EditFileDialog from "@/components/global/EditFileDialog.vue";
import RenameDocument from "@/components/global/RenameDocument.vue";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAccessibilityUpdate } from "@/composables/files/useAccessibilityUpdate";
import { useDeleteFile } from "@/composables/files/useDeleteFile";
import { useGetFile } from "@/composables/files/useGetFile";
import { useUpdateFile } from "@/composables/files/useUpdateFile";
import { useMultiDelete } from "@/composables/settings/useMultiDelete";
import { useDeleteAttach } from "@/composables/uploads/useDeleteAttach";
import { useDownloadAttach } from "@/composables/uploads/useDownloadAttach";
import { useApi } from "@/composables/useApi";
import { useDataRefresh } from "@/composables/useDataRefresh";
import { createError } from "h3";
import { Download, Edit, Eye, EyeOff, File as FileIcon, Loader2, MoreHorizontal, MoreVertical, MousePointerClick, Pencil, Plus, Search, Trash } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import AddDocumentDialog from "~/components/global/AddDocumentDialog.vue";
import LoadingSpinner from "~/components/LoadingSpinner.vue";
import { useGetFolderById } from "~/composables/folders/useGetFolderById";
import { usePermissions } from "~/composables/usePermissions";

definePageMeta({
  key: (route) => String(route.params.id),
  middleware: "permission",
});

const route = useRoute();
const localePath = useLocalePath();
const { locale, t } = useI18n();
const isRtl = computed(() => locale.value === "ar");
const { canCreate, canUpdate, canDelete, canRead } = usePermissions();

// Check if user has read permission for files
const hasReadPermission = canRead("files");
// Check if user has read permission for documents
const hasDocumentReadPermission = canRead("documents");

/* ---------- helpers (strict id parsing: empty/invalid -> null, never 0) ---------- */
const idParam = (val: unknown) => String(Array.isArray(val) ? val[0] : val ?? "").trim();

const parseNumericId = (val: unknown): number | null => {
  const s = idParam(val);
  if (!/^\d+$/.test(s)) return null; // reject empty or non-digits
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const fileId = computed<number | null>(() =>
  parseNumericId((route.params as Record<string, string | string[]>).id ?? (route.params as Record<string, string | string[]>).Id)
);

// Check for valid file ID
if (fileId.value == null) {
  throw createError({ statusCode: 404, statusMessage: "Invalid file id" });
}

// Safe file ID for components that require non-null number
const safeFileId = computed(() => fileId.value!);

// Fetch file data only if user has permission
const {
  data: fileData,
  pending: filePending,
  error: fileError,
  refresh: refreshFile,
  assignedRolesToFile: assignedRolesToFileFromComposable,
  assignedAdminsToFile: assignedAdminsToFileFromComposable,
} = hasReadPermission
  ? useGetFile(fileId.value)
  : {
      data: ref(null),
      pending: ref(false),
      error: ref(null),
      refresh: () => Promise.resolve(),
      assignedRolesToFile: ref([]),
      assignedAdminsToFile: ref([]),
    };
const file = computed(() => fileData.value?.data || null);

// Define folder data interface
interface FolderData {
  data?: {
    category_id?: number;
    category_title?: string;
  };
}

// Fetch folder data when file is loaded
const folderId = computed(() => file.value?.folder_id);
const folderData = ref<FolderData | null>(null);
const folderPending = ref(false);
const folderError = ref<unknown>(null);

// Fetch folder data with reactive folder ID
const { assignedRolesToFolder, assignedAdminsToFolder } = useGetFolderById(folderId);

// Function to fetch folder data using $fetch directly
const fetchFolderData = async (id: number) => {
  if (!id) return;

  folderPending.value = true;
  folderError.value = null;

  try {
    const api = useApi();
    const response = await api(`/folders/${id}`, {
      method: "GET",
    });
    folderData.value = response as unknown as FolderData;
  } catch (err) {
    folderError.value = err;
  } finally {
    folderPending.value = false;
  }
};

// Watch for folder ID changes and fetch folder data
watch(
  folderId,
  (newFolderId) => {
    if (newFolderId) {
      fetchFolderData(newFolderId);
    }
  },
  { immediate: true }
);

const folder = computed(() => folderData.value?.data || null);

// Data refresh utilities
const { refreshAfterFileDelete } = useDataRefresh();

// Handle file API errors - check immediately and watch for changes (only if user has permission)
const handleFileError = (err: unknown) => {
  if (err && hasReadPermission) {
    const statusCode = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { statusCode?: number; status?: number })?.status;
    if (statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: "File not found" });
    }
    // For other errors, show toast
    toast.error(t("files.deleteFailed"));
  }
};

// Check error immediately (for SSR) - only if user has permission
if (hasReadPermission) {
  handleFileError(fileError.value);
}

// Watch for file errors and throw 404 if resource not found - only if user has permission
if (hasReadPermission) {
  watch(fileError, handleFileError, { immediate: true });
}

// Computed properties for display
const fileName = computed(() => {
  return locale.value === "ar" ? file.value?.title_ar : file.value?.title_en;
});

const fileDescription = computed(() => {
  return locale.value === "ar" ? file.value?.description_ar : file.value?.description_en;
});

// SEO Meta Tags - Dynamic based on file
const config = useRuntimeConfig();
const siteUrl = config.public.apiBase?.replace("/api", "") || "";
const canonicalUrl = computed(() => `${siteUrl}${route.path}`);

const pageTitle = computed(() => {
  if (!fileName.value) return "File - Kandil Internal Portal";
  return `${fileName.value} - Kandil Internal Portal`;
});

const pageDescription = computed(() => {
  if (!file.value) return "View file details and manage documents in Kandil Internal Portal.";
  const title = fileName.value || "File";
  const desc = fileDescription.value ? ` - ${fileDescription.value}` : "";
  return `View ${title} file details${desc} in Kandil Internal Portal.`;
});

// Structured Data (JSON-LD) for SEO - DocumentObject schema for files
const structuredData = computed(() => {
  const categoryName = folder.value?.category_title || "Category";
  const folderName = folder.value ? (locale.value === "ar" ? folder.value.title_ar : folder.value.title_en) : null;

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
  ];

  const categoryIdVal = folder.value?.category_id;
  if (categoryIdVal) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: categoryName,
      item: `${siteUrl}/categories/${categoryIdVal}`,
    });
  }

  if (folderId.value && folderName) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: folderName,
      item: `${siteUrl}/folders/${folderId.value}`,
    });
  }

  if (fileName.value) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: fileName.value,
      item: canonicalUrl.value,
    });
  }

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle.value,
    description: pageDescription.value,
    url: canonicalUrl.value,
    isPartOf: {
      "@type": "WebSite",
      name: "Kandil Internal Portal",
      url: siteUrl,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
  };

  // Add DocumentObject schema if file data is available
  if (file.value) {
    return [
      baseSchema,
      {
        "@context": "https://schema.org",
        "@type": "DocumentObject",
        name: fileName.value,
        description: fileDescription.value || "",
        url: canonicalUrl.value,
        dateCreated: file.value.created_at,
        dateModified: file.value.updated_at,
      },
    ];
  }

  return baseSchema;
});

// Watch file and update meta tags
watch(
  [file, fileName, fileDescription, locale, folderId],
  () => {
    const schemaData = structuredData.value;
    const scripts = Array.isArray(schemaData) ? schemaData : [schemaData];

    useHead({
      title: pageTitle.value,
      meta: [
        {
          name: "description",
          content: pageDescription.value,
        },
        {
          property: "og:title",
          content: pageTitle.value,
        },
        {
          property: "og:description",
          content: pageDescription.value,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:url",
          content: canonicalUrl.value,
        },
        {
          property: "og:locale",
          content: locale.value === "ar" ? "ar_EG" : "en_US",
        },
      ],
      link: [
        {
          rel: "canonical",
          href: canonicalUrl.value,
        },
      ],
      script: scripts.map((data) => ({
        type: "application/ld+json",
        innerHTML: JSON.stringify(data),
      })),
      htmlAttrs: {
        lang: locale.value || "en",
      },
    });
  },
  { immediate: true, deep: true }
);

// Use assigned roles and admins from composable (includes role_id)
const assignedRolesToFile = assignedRolesToFileFromComposable;
const assignedAdminsToFile = assignedAdminsToFileFromComposable;

// Determine viewBy mode based on assigned roles/admins
const fileViewBy = computed(() => {
  if (!file.value) return "role";

  const hasRoles = file.value.roles_has_access && file.value.roles_has_access.length > 0;
  const hasAdmins = file.value.admins_has_access && file.value.admins_has_access.length > 0;

  if (hasRoles) return "role";
  if (hasAdmins) return "users";
  return "role"; // default
});

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString();
};

const filteredAttachments = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q || !file.value?.attachments) return file.value?.attachments ?? [];
  return file.value.attachments.filter((attachment) => attachment.title.toLowerCase().includes(q) || attachment.name.toLowerCase().includes(q));
});

// Get selected attachment
const selectedAttachment = computed(() => {
  if (!selectedAttachmentId.value || !file.value?.attachments) return null;
  return file.value.attachments.find((a) => a.id === selectedAttachmentId.value) || null;
});

// Extract assigned roles and admins from selected attachment
const assignedRolesToAttachment = computed(() => {
  if (!selectedAttachment.value?.roles_has_access) return [];
  return selectedAttachment.value.roles_has_access.map((role) => ({
    id: role.id,
    name: role.name,
  }));
});

const assignedAdminsToAttachment = computed(() => {
  if (!selectedAttachment.value?.admins_has_access) return [];
  return selectedAttachment.value.admins_has_access.map((admin) => ({
    id: admin.id,
    name: admin.name,
    role_id: admin.role_id,
  }));
});

// Determine viewBy mode for selected attachment
const attachmentViewBy = computed(() => {
  if (!selectedAttachment.value) return "role";

  const hasRoles = selectedAttachment.value.roles_has_access && selectedAttachment.value.roles_has_access.length > 0;
  const hasAdmins = selectedAttachment.value.admins_has_access && selectedAttachment.value.admins_has_access.length > 0;

  if (hasRoles) return "role";
  if (hasAdmins) return "users";
  return "role"; // default
});

const search = ref("");
const deleteDialogOpen = ref(false);
const accessDialogOpen = ref(false);
const editDialogOpen = ref(false);
const accessibilityDialogOpen = ref(false);
const renameDialogOpen = ref(false);
const deleteAttachmentDialogOpen = ref(false);
const selectedAttachmentId = ref<number | null>(null);
const attachmentIdPendingDelete = ref<number | null>(null);

watch(deleteAttachmentDialogOpen, (isOpen) => {
  if (!isOpen) {
    attachmentIdPendingDelete.value = null;
  }
});

// Check if attachment has accessibility restrictions (not shared with ALL users)
const hasAccessibilityRestrictions = (attachment: { roles_has_access?: unknown[]; admins_has_access?: unknown[] }) => {
  const attachmentRoles = attachment.roles_has_access || [];
  const attachmentAdmins = attachment.admins_has_access || [];

  // If no roles and no admins assigned, it's shared with all (no eye icon)
  if (attachmentRoles.length === 0 && attachmentAdmins.length === 0) {
    return false;
  }

  // Get available roles and admins from folder
  const availableRoles = assignedRolesToFolder.value || [];
  const availableAdmins = assignedAdminsToFolder.value || [];

  // If document is assigned to specific roles (not all roles), show eye icon
  if (attachmentRoles.length > 0 && attachmentRoles.length < availableRoles.length) {
    return true;
  }

  // If document is assigned to specific admins (not all admins), show eye icon
  if (attachmentAdmins.length > 0 && attachmentAdmins.length < availableAdmins.length) {
    return true;
  }

  // If assigned to ALL available roles or ALL available admins, no restriction (no eye icon)
  return false;
};

// Bulk actions state
const selectedAttachments = ref<Set<number>>(new Set());
const bulkDeleteDialogOpen = ref(false);
const bulkOperationInProgress = ref(false);

const hasAttachments = computed(() => (file.value?.attachments?.length ?? 0) > 0);

const allSelected = computed(() => {
  const attachments = file.value?.attachments ?? [];
  return attachments.length > 0 && selectedAttachments.value.size === attachments.length;
});

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedAttachments.value.clear();
  } else {
    const attachments = file.value?.attachments ?? [];
    selectedAttachments.value = new Set(attachments.map((a) => a.id));
  }
};

const toggleAttachment = (id: number) => {
  if (selectedAttachments.value.has(id)) {
    selectedAttachments.value.delete(id);
  } else {
    selectedAttachments.value.add(id);
  }
};

const handleBulkDownload = async () => {
  const selectedIds = Array.from(selectedAttachments.value);
  if (selectedIds.length === 0 || bulkOperationInProgress.value) return;

  bulkOperationInProgress.value = true;
  try {
    // Download each attachment one by one in sequence
    for (let i = 0; i < selectedIds.length; i++) {
      const attachmentId = selectedIds[i];
      if (!attachmentId) continue;
      try {
        await handleDownloadAttachment(attachmentId);

        // Wait longer between downloads to ensure they fire properly in sequence
        if (i < selectedIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("files.deleteFailed"));
      }
    }
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("files.updateFailed"));
  } finally {
    bulkOperationInProgress.value = false;
  }
};

const handleBulkDelete = async () => {
  const selectedIds = Array.from(selectedAttachments.value);
  if (selectedIds.length === 0 || bulkOperationInProgress.value) return;

  bulkOperationInProgress.value = true;
  try {
    // Use multi-delete API for better performance
    const result = await useMultiDelete({
      model_name: "attachment",
      ids: selectedIds,
    });

    if (result.error) {
      toast.error(t("files.deleteFailed"));
      return;
    }

    toast.success(t("files.fileDeleted"));
    selectedAttachments.value.clear();
    bulkDeleteDialogOpen.value = false;

    // Refresh file data to update UI
    await refreshFile();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t("files.deleteFailed"));
  } finally {
    bulkOperationInProgress.value = false;
  }
};

// File CRUD operations
const handleEditFile = async (data: {
  id: number;
  payload: { en: { title: string; description: string }; ar: { title: string; description: string }; parent_id: number };
}) => {
  if (!fileId.value || !file.value) return;

  try {
    const result = await useUpdateFile(data.id, data.payload);

    if (result.error || result.status >= 400) {
      toast.error(result.message || t("files.updateFailed"));
      return;
    }

    await refreshFile();

    toast.success(t("files.fileUpdated"));
    editDialogOpen.value = false;
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("files.updateFailed"));
  }
};

const handleDeleteFile = async () => {
  if (!fileId.value) return;

  try {
    const result = await useDeleteFile(fileId.value);

    if (result.error || result.status >= 400) {
      toast.error(result.message || t("files.deleteFailed"));
      return;
    }

    await refreshAfterFileDelete(file.value?.category_id || undefined);

    toast.success(t("files.fileDeleted"));
    deleteDialogOpen.value = false;

    if (file.value?.folder_id) {
      await navigateTo(localePath(`/folders/${file.value.folder_id}`));
    } else if (file.value?.category_id) {
      await navigateTo(localePath(`/categories/${file.value.category_id}`));
    } else {
      await navigateTo(localePath("/"));
    }
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("files.deleteFailed"));
  }
};

// Attachment actions
const handleDownloadAttachment = async (attachmentId: number) => {
  try {
    // Find the attachment in the current file data to get the title
    const attachment = file.value?.attachments?.find((a) => a.id === attachmentId);

    // Call the endpoint to get the file URL
    const result = await useDownloadAttach(attachmentId);

    if (result.error || result.status >= 400) {
      toast.error(result.message || t("files.deleteFailed"));
      return;
    }

    // Open URL in new tab and close it
    if (result.data?.url) {
      // Use attachment title from UI instead of hashed filename from backend
      const filename = attachment?.title || result.data.filename || `attachment_${attachmentId}`;

      // Create a temporary link to trigger download with proper filename
      const link = document.createElement("a");
      link.href = result.data.url;
      link.download = filename;
      link.target = "_blank";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(result.message || t("files.downloading"));
    } else {
      toast.error(result.message || t("files.deleteFailed"));
    }
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("files.deleteFailed"));
  }
};

const handleDeleteAttachment = async (attachmentId: number) => {
  try {
    const result = await useDeleteAttach(attachmentId);

    if (result.error || result.status >= 400) {
      toast.error(result.message || t("files.deleteFailed"));
      return false;
    }

    toast.success(result.message || t("files.fileUpdated"));

    // Refresh file data to update attachments list
    await refreshFile();
    return true;
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("files.deleteFailed"));
    return false;
  }
};

const confirmAttachmentDeletion = async () => {
  if (!attachmentIdPendingDelete.value) return;
  const success = await handleDeleteAttachment(attachmentIdPendingDelete.value);
  if (success) {
    deleteAttachmentDialogOpen.value = false;
    attachmentIdPendingDelete.value = null;
  }
};

// Handle document added from AddDocumentDialog
const handleDocumentAdded = async (newAttachmentIds?: number[], uploadedRoleIds?: number[], uploadedAdminIds?: number[]) => {
  try {
    if (newAttachmentIds && newAttachmentIds.length > 0 && file.value) {
      // Get folder_id from file data returned by useGetFile and use it as parent_id
      const parentId = file.value.folder_id;

      if (!parentId) {
        toast.error(t("files.deleteFailed"));
        return;
      }

      // Extract current role_ids and admin_ids from file
      const currentRoleIds = file.value.roles_has_access?.map((role) => role.id) || [];
      const currentAdminIds = file.value.admins_has_access?.map((admin) => admin.id) || [];

      // Determine which type was used during upload and use current IDs from file for that type
      // If role_ids were used during upload, use current role_ids from file
      // If admin_ids were used during upload, use current admin_ids from file
      const payload: Partial<{ parent_id: number; attachments: number[]; role_ids?: number[]; admin_ids?: number[] }> = {
        parent_id: parentId,
        attachments: newAttachmentIds,
      };

      // If role_ids were used during upload, use current role_ids from file
      if (uploadedRoleIds && uploadedRoleIds.length > 0 && currentRoleIds.length > 0) {
        payload.role_ids = currentRoleIds;
      }

      // If admin_ids were used during upload, use current admin_ids from file
      if (uploadedAdminIds && uploadedAdminIds.length > 0 && currentAdminIds.length > 0) {
        payload.admin_ids = currentAdminIds;
      }

      const updateResult = await useUpdateFile(file.value.id, payload as Parameters<typeof useUpdateFile>[1]);

      if (updateResult.error || updateResult.status >= 400) {
        toast.error(updateResult.message || t("files.updateFailed"));
        return;
      }

      // Refresh file data after update
      await refreshFile();

      // Show success toast with number of files added
      const count = newAttachmentIds.length;
      toast.success(t("files.documentsAdded", { count }) || `${count} ${count === 1 ? "document" : "documents"} added successfully`);
    }
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("files.updateFailed"));
  }
};

const handleOpenAccessibilityDialog = (attachmentId: number) => {
  selectedAttachmentId.value = attachmentId;
  accessibilityDialogOpen.value = true;
};

const handleOpenRenameDialog = (attachmentId: number) => {
  selectedAttachmentId.value = attachmentId;
  renameDialogOpen.value = true;
};

const handleRenameSuccess = async () => {
  // Refresh file data to show updated name
  await refreshFile();
};

const handleOpenDeleteAttachmentDialog = (attachmentId: number) => {
  attachmentIdPendingDelete.value = attachmentId;
  deleteAttachmentDialogOpen.value = true;
};

const handleSaveAccessibility = async (data: { viewBy: "role" | "users"; roles: string[]; users: string[] }) => {
  if (!file.value || !selectedAttachmentId.value) return;

  try {
    // Get available roles and users from props
    const availableRolesList = assignedRolesToFile.value || [];
    const availableAdminsList = assignedAdminsToFile.value || [];

    // Convert selected roles to IDs
    const roleIds = data.roles.map((roleName) => availableRolesList.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];

    // Convert selected users to IDs
    const adminIds = data.users.map((userName) => availableAdminsList.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];

    // Prepare payload based on viewBy mode
    const payload: { role_ids?: number[]; admin_ids?: number[] } = {};

    if (data.viewBy === "role") {
      // In role mode: send role_ids and clear admin_ids
      payload.role_ids = roleIds;
      payload.admin_ids = []; // Clear admin_ids when using role mode
    } else {
      // In users mode: send admin_ids and clear role_ids
      payload.admin_ids = adminIds;
      payload.role_ids = []; // Clear role_ids when using users mode
    }

    // Update the attachment accessibility using the dedicated composable with attachment ID
    const updateResult = await useAccessibilityUpdate(selectedAttachmentId.value, payload);

    if (updateResult.error || updateResult.status >= 400) {
      toast.error(updateResult.message || t("files.updateFailed"));
      return;
    }

    // Update the attachment data in file.attachments array
    if (updateResult.data?.data && file.value?.attachments) {
      const attachmentIndex = file.value.attachments.findIndex((a) => a.id === selectedAttachmentId.value);
      if (attachmentIndex !== -1) {
        file.value.attachments[attachmentIndex] = updateResult.data.data;
      }
    }

    toast.success(t("files.fileUpdated"));
    accessibilityDialogOpen.value = false;
    selectedAttachmentId.value = null;

    // Refresh file data to show updated accessibility
    await refreshFile();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t("files.updateFailed"));
  }
};
</script>

<template>
  <div class="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8 bg-gray-50 mb-50">
    <!-- No Permission State -->
    <div v-if="!hasReadPermission" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <FileIcon class="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" />
      <h2 class="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">{{ t("files.noPermission") }}</h2>
      <p class="text-gray-400 text-sm sm:text-base">{{ t("files.noPermissionDescription") }}</p>
    </div>

    <!-- Content with Permission -->
    <template v-else>
      <Breadcrumb>
        <BreadcrumbList class="flex flex-wrap gap-1 text-xs sm:text-sm">
          <BreadcrumbItem>{{ t("categories.breadcrumb") }}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <NuxtLinkLocale v-if="folder?.category_id && folder?.category_title" :to="'/categories/' + folder.category_id">
              {{ folder.category_title }}
            </NuxtLinkLocale>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <NuxtLinkLocale v-if="file?.folder_id && file?.folder_title" :to="'/folders/' + file.folder_id">
              {{ file.folder_title }}
            </NuxtLinkLocale>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage class="font-semibold"> {{ fileName }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div class="rounded-xl bg-white p-4 sm:p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <h1 class="text-xl sm:text-2xl md:text-3xl font-bold break-words flex-1 flex flex-col gap-3">
            <span>{{ fileName }}</span>
            <small v-if="file?.created_at" class="!text-sm text-gray-400 font-normal">{{ formatDate(file.created_at) }}</small>
          </h1>

          <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <DropdownMenu v-if="hasAttachments && (hasDocumentReadPermission || canDelete('documents'))">
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="bulkOperationInProgress"
                  :class="[
                    'cursor-pointer rounded-lg border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed',
                    isRtl ? 'flex-row-reverse' : '',
                  ]"
                  aria-label="Bulk actions"
                >
                  <Loader2 v-if="bulkOperationInProgress" class="w-3.5 h-3.5 animate-spin" />
                  <MoreVertical v-else class="w-3.5 h-3.5" />
                  <span class="hidden lg:inline">{{ bulkOperationInProgress ? t("files.processing") : t("files.bulkActions") }}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56 shadow-lg border border-gray-100 rounded-lg">
                <DropdownMenuItem :class="[isRtl ? 'flex-row-reverse' : '']" @click="toggleSelectAll">
                  <MousePointerClick :class="['w-3.5 h-3.5', isRtl ? 'ms-2' : 'me-2']" />
                  {{ allSelected ? t("files.deselectAll") : t("files.selectAll") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="hasDocumentReadPermission"
                  :class="[isRtl ? 'flex-row-reverse' : '']"
                  :disabled="selectedAttachments.size === 0 || bulkOperationInProgress"
                  @click="handleBulkDownload"
                >
                  <Download :class="['w-3.5 h-3.5', isRtl ? 'ms-2' : 'me-2']" />
                  {{ bulkOperationInProgress ? t("files.downloading") : t("files.downloadSelected", { count: selectedAttachments.size }) }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="canDelete('documents')"
                  :class="['text-red-600 focus:text-red-600', isRtl ? 'flex-row-reverse' : '']"
                  :disabled="selectedAttachments.size === 0 || bulkOperationInProgress"
                  @click="bulkDeleteDialogOpen = true"
                >
                  <Trash :class="['w-3.5 h-3.5 text-red-600', isRtl ? 'ms-2' : 'me-2']" />
                  {{ bulkOperationInProgress ? t("files.processing") : t("files.deleteSelected", { count: selectedAttachments.size }) }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <EditFileDialog
              v-if="canUpdate('files')"
              :is-open="editDialogOpen"
              :file-item="file"
              :view-by="fileViewBy"
              :roles="assignedRolesToFolder"
              :users="assignedAdminsToFolder"
              :assigned-roles="assignedRolesToFile"
              :assigned-users="assignedAdminsToFile"
              @update-file="handleEditFile"
              @file-updated="refreshFile"
              @close="editDialogOpen = false"
            >
              <Button
                size="sm"
                class="rounded-lg bg-white text-[#0080a5] border border-[#0080a5] hover:bg-[#e6f7fa] hover:border-[#006d8a] hover:text-[#006d8a] cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                @click="editDialogOpen = true"
              >
                <Pencil class="w-3.5 h-3.5" />
                <span class="hidden lg:inline text-sm md:text-base">{{ t("files.editFile") }}</span>
              </Button>
            </EditFileDialog>

            <Button
              v-if="canDelete('files')"
              size="sm"
              class="rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              @click="deleteDialogOpen = true"
            >
              <Trash class="w-3.5 h-3.5" />
              <span class="hidden lg:inline text-xs lg:text-sm">{{ t("files.deleteFile") }}</span>
            </Button>
          </div>
        </div>
      </div>

      <div v-if="fileDescription && fileDescription" class="rounded-xl p-4 bg-white shadow-sm border border-gray-200">
        <h3 class="text-base sm:text-lg font-semibold mb-2 text-gray-800">{{ t("files.description") }}</h3>
        <p class="text-gray-600 leading-relaxed">{{ fileDescription }}</p>
      </div>

      <!-- Show only Add Documents button when no description and no documents -->
      <div v-if="(!fileDescription || fileDescription) && !hasAttachments" class="rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-gray-200">
        <div v-if="filePending" class=""><LoadingSpinner /></div>
        <div v-else class="flex justify-center py-8">
          <template v-if="canCreate('documents')">
            <AddDocumentDialog :file-id="safeFileId" :file="file" :roles="assignedRolesToFile" :users="assignedAdminsToFile" @document-added="handleDocumentAdded">
              <div class="flex justify-center items-center w-full">
                <div class="flex flex-col items-center gap-3 cursor-pointer">
                  <div class="h-16 w-16 rounded-full bg-[#7cc6dd] bg-opacity-60 flex items-center justify-center">
                    <Plus class="text-white w-8 h-8" />
                  </div>
                  <span class="text-[#2aa1bf] text-sm md:text-base font-medium">{{ t("files.documents") }}</span>
                </div>
              </div>
            </AddDocumentDialog>
          </template>
          <div v-else class="flex flex-col items-center text-center gap-3">
            <FileIcon class="w-12 h-12 text-gray-300" />
            <p class="text-gray-500 text-sm md:text-base">{{ t("files.noDocumentsFound") }}</p>
          </div>
        </div>
      </div>

      <!-- Show full documents section when there are documents or description -->
      <div v-else class="rounded-xl bg-white p-4 sm:p-5 space-y-4 shadow-sm border border-gray-200">
        <!-- Header with title and search bar -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">{{ t("files.documents") }}</h3>

          <div class="flex items-center relative w-50">
            <Input
              v-model="search"
              :placeholder="t('files.search')"
              :class="['w-48 sm:w-72 border-[#E5E5E5] placeholder:text-[#A3A3A3]', locale === 'ar' ? 'pe-10' : 'ps-10']"
            />
            <Search :class="['text-[#E5E5E5] !text-sm absolute top-1/2 -translate-y-1/2', locale === 'ar' ? 'end-2' : 'start-2']" />
          </div>
        </div>

        <div v-if="filePending" class=""><LoadingSpinner /></div>
        <div v-else-if="!hasAttachments" class="flex justify-center py-8">
          <template v-if="canCreate('documents')">
            <AddDocumentDialog :file-id="safeFileId" :file="file" :roles="assignedRolesToFile" :users="assignedAdminsToFile" @document-added="handleDocumentAdded">
              <div class="flex flex-col items-center gap-3 cursor-pointer">
                <div class="h-16 w-16 rounded-full bg-[#7cc6dd] bg-opacity-60 flex items-center justify-center">
                  <Plus class="text-white w-8 h-8" />
                </div>
                <span class="text-[#2aa1bf] text-sm md:text-base font-medium">{{ t("files.documents") }}</span>
              </div>
            </AddDocumentDialog>
          </template>
          <div v-else class="flex flex-col items-center text-center gap-3">
            <FileIcon class="w-12 h-12 text-gray-300" />
            <p class="text-gray-500 text-sm md:text-base">{{ t("files.noDocumentsFound") }}</p>
          </div>
        </div>
        <div v-else class="grid gap-3 sm:gap-4 lg:gap-5 [--min:140px] sm:[--min:160px] lg:[--min:180px] [grid-template-columns:repeat(auto-fill,minmax(var(--min),1fr))]">
          <div
            v-for="attachment in filteredAttachments"
            :key="attachment.id"
            class="relative rounded-xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 cursor-pointer flex flex-col h-36 sm:h-40 hover:shadow-lg hover:border-gray-300"
          >
            <div v-if="hasDocumentReadPermission || canDelete('documents')" class="absolute top-2 start-2 z-20">
              <input type="checkbox" class="cursor-pointer" :checked="selectedAttachments.has(attachment.id)" @change="toggleAttachment(attachment.id)" />
            </div>

            <div v-if="hasAccessibilityRestrictions(attachment) && canUpdate('documents')" class="absolute top-2 end-2 z-20">
              <div class="h-6 w-6 rounded-full flex items-center justify-center" style="background-color: rgba(104, 104, 104, 0.48)">
                <EyeOff class="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div class="flex flex-1 items-center justify-center p-3 relative">
              <FileIcon class="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>

            <div class="flex items-center justify-between w-full px-2 py-1.5 shrink-0 bg-gradient-to-r from-[#e8faff] to-[#f0f9ff]">
              <div class="flex items-center gap-1 min-w-0">
                <p class="text-xs font-medium truncate text-black">
                  {{ attachment.title }}
                </p>
              </div>
              <DropdownMenu v-if="hasDocumentReadPermission || canUpdate('documents') || canDelete('documents')">
                <DropdownMenuTrigger as-child>
                  <button
                    class="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/80 hover:shadow-sm cursor-pointer shrink-0 transition-all duration-200 relative z-30"
                    aria-label="More actions"
                  >
                    <MoreHorizontal class="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent :align="locale === 'ar' ? 'start' : 'end'" class="w-40 text-xs shadow-lg border border-gray-100 rounded-lg">
                  <DropdownMenuItem v-if="hasDocumentReadPermission" :class="[isRtl ? 'flex-row-reverse' : '']" @click="handleDownloadAttachment(attachment.id)">
                    <Download :class="['w-3.5 h-3.5', isRtl ? 'ms-2' : 'me-2']" />
                    {{ t("files.download") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="canUpdate('documents')" :class="[isRtl ? 'flex-row-reverse' : '']" @click="handleOpenRenameDialog(attachment.id)">
                    <Edit :class="['w-3.5 h-3.5', isRtl ? 'ms-2' : 'me-2']" />
                    {{ t("files.rename") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="canUpdate('documents')" :class="[isRtl ? 'flex-row-reverse' : '']" @click="handleOpenAccessibilityDialog(attachment.id)">
                    <Eye :class="['w-3.5 h-3.5', isRtl ? 'ms-2' : 'me-2']" />
                    {{ t("files.accessibility") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="canDelete('documents')"
                    :class="['text-red-600 focus:text-red-600', isRtl ? 'flex-row-reverse' : '']"
                    @click="handleOpenDeleteAttachmentDialog(attachment.id)"
                  >
                    <Trash :class="['w-3.5 h-3.5 text-red-600', isRtl ? 'ms-2' : 'me-2']" />
                    {{ t("dialog.delete.confirm") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div
            v-if="canCreate('documents')"
            class="relative rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer flex h-36 sm:h-40"
          >
            <AddDocumentDialog :file-id="safeFileId" :file="file" :roles="assignedRolesToFile" :users="assignedAdminsToFile" @document-added="handleDocumentAdded">
              <div class="flex flex-1 flex-col items-center justify-center p-3 gap-2.5">
                <div
                  class="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-[#7cc6dd] to-[#5bb3d1] shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-200"
                >
                  <Plus class="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span class="text-[#2aa1bf] text-sm md:text-base font-medium">{{ t("files.documents") }}</span>
              </div>
            </AddDocumentDialog>
          </div>
        </div>
      </div>

      <DeleteItemDialog
        v-model:open="deleteDialogOpen"
        :title="t('dialog.delete.title')"
        :description="t('dialog.delete.fileDescription')"
        :confirm-text="t('dialog.delete.confirm')"
        :cancel-text="t('dialog.buttons.cancel')"
        @confirm="handleDeleteFile"
      />

      <DeleteItemDialog
        v-model:open="bulkDeleteDialogOpen"
        :title="t('files.bulkDeleteTitle', { count: selectedAttachments.size })"
        :description="t('files.bulkDeleteDescription')"
        :confirm-text="t('dialog.delete.confirm')"
        :cancel-text="t('dialog.buttons.cancel')"
        @confirm="handleBulkDelete"
      />

      <DeleteItemDialog
        v-model:open="deleteAttachmentDialogOpen"
        :title="t('dialog.delete.title')"
        :description="t('dialog.delete.documentDescription')"
        :confirm-text="t('dialog.delete.confirm')"
        :cancel-text="t('dialog.buttons.cancel')"
        @confirm="confirmAttachmentDeletion"
      />

      <AccessibilityDialog
        :is-open="accessibilityDialogOpen"
        :roles="assignedRolesToFile"
        :users="assignedAdminsToFile"
        :view-by="attachmentViewBy"
        :assigned-roles="assignedRolesToAttachment"
        :assigned-users="assignedAdminsToAttachment"
        @close="accessibilityDialogOpen = false"
        @save-accessibility="handleSaveAccessibility"
      />

      <RenameDocument
        :is-open="renameDialogOpen"
        :attachment-title="selectedAttachment?.title || ''"
        :attachment-id="selectedAttachmentId || 0"
        @close="
          renameDialogOpen = false;
          selectedAttachmentId = null;
        "
        @renamed="handleRenameSuccess"
      />

      <Dialog v-model:open="accessDialogOpen">
        <DialogContent class="sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 rounded-2xl shadow-lg bg-white space-y-6">
          <DialogHeader class="space-y-1">
            <DialogTitle class="text-lg sm:text-xl font-semibold text-gray-900">{{ t("files.accessibility") }}</DialogTitle>
            <DialogDescription class="sr-only">{{ t("files.manageAccess") }}</DialogDescription>
          </DialogHeader>

          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600 mb-2">Who has access to this document</p>
              <div class="flex items-center justify-between bg-[#EDF7FB] rounded-lg px-3 py-2">
                <span class="text-sm font-medium text-gray-800">By Role</span>
                <button type="button" class="text-sm font-medium text-[#2AA1BF] hover:underline cursor-pointer">Edit</button>
              </div>
            </div>

            <div class="divide-y rounded-lg border">
              <div v-for="i in 3" :key="i" class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <span class="text-gray-800">Full Access</span>
                <span class="text-gray-500 text-sm">12 people ›</span>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-400">
            Managing: <strong>{{ fileName }}</strong>
          </p>
        </DialogContent>
      </Dialog>
    </template>
  </div>
</template>

<style scoped>
input[type="checkbox"]:checked {
  accent-color: #111111;
}
input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
</style>
