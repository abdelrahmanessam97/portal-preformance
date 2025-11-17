<!-- /app/pages/folders/[id]/index.vue -->
<script setup lang="ts">
import { navigateTo } from "#app";
import { useLocalePath } from "#i18n";

import { createError } from "h3";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, FileIcon, Plus, Search, SquarePen, Trash } from "lucide-vue-next";

import CreateItemDialog from "~/components/global/CreateItemDialog.vue";
import DeleteItemDialog from "~/components/global/DeleteItemDialog.vue";
import EditItemDialog from "~/components/global/EditItemDialog.vue";
import LoadingSpinner from "~/components/LoadingSpinner.vue";
import { useFetchCategories } from "~/composables/categories/useFetchCategories";
import { useGetCategory } from "~/composables/categories/useGetCategory";
import { useCreateFile } from "~/composables/files/useCreateFile";
import { useDeleteFolder } from "~/composables/folders/useDeleteFolder";
import { useGetFolderById } from "~/composables/folders/useGetFolderById";
import { useUpdateFolder } from "~/composables/folders/useUpdateFolder";
import { useFetchRolesAndAdmins } from "~/composables/roles/useFetchRolesAndAdmins";
import { useDataRefresh } from "~/composables/useDataRefresh";
import { usePermissions } from "~/composables/usePermissions";

definePageMeta({
  key: (route) => String(route.params.id),
  middleware: "permission",
});

const route = useRoute();
const localePath = useLocalePath();
const { locale, t } = useI18n();
const { canCreate, canUpdate, canDelete, canRead } = usePermissions();

// Check if user has read permission for folders
const hasReadPermission = canRead("folders");

/* ---------- helpers (strict id parsing: empty/invalid -> null, never 0) ---------- */
const idParam = (val: unknown) => String(Array.isArray(val) ? val[0] : val ?? "").trim();

const parseNumericId = (val: unknown): number | null => {
  const s = idParam(val);
  if (!/^\d+$/.test(s)) return null; // reject empty or non-digits
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const folderId = computed<number | null>(() =>
  parseNumericId((route.params as Record<string, string | string[]>).id ?? (route.params as Record<string, string | string[]>).Id)
);

type MaybeFetchError = {
  statusCode?: number;
  status?: number;
  response?: { status?: number };
};

const isForbiddenError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const maybe = err as MaybeFetchError;
  if (maybe.statusCode === 403 || maybe.status === 403) return true;
  if (maybe.response?.status === 403) return true;
  return false;
};

// Check for valid folder ID
if (folderId.value == null) {
  throw createError({ statusCode: 404, statusMessage: "Invalid folder id" });
}

// Only fetch folder details if user has permission
const {
  data: folderData,
  pending: folderPending,
  error: folderError,
  refresh: refreshFolder,
  folderDetail,
  assignedRolesToFolder,
  assignedAdminsToFolder,
} = hasReadPermission ? useGetFolderById(folderId.value!) : {
  data: ref(null),
  pending: ref(false),
  error: ref(null),
  refresh: () => Promise.resolve(),
  folderDetail: ref(null),
  assignedRolesToFolder: ref([]),
  assignedAdminsToFolder: ref([]),
};

// Handle API errors - check immediately and watch for changes (only if user has permission)
const handleFolderError = (err: unknown) => {
  if (err && hasReadPermission) {
    const statusCode = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { statusCode?: number; status?: number })?.status;
    if (statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: "Folder not found" });
    }
  }
};

// Check error immediately (for SSR) - only if user has permission
if (hasReadPermission) {
  handleFolderError(folderError.value);
}

// Watch for API errors and throw 404 if resource not found - only if user has permission
if (hasReadPermission) {
  watch(folderError, handleFolderError, { immediate: true });
}

// Extract files from folder data
const files = computed(() => folderData.value?.data?.files ?? []);
const folderForbidden = computed(() => isForbiddenError(folderError.value));
const filesPending = computed(() => folderPending.value);
const filesError = computed(() => (folderForbidden.value ? null : folderError.value));

// Fetch ALL roles and admins for dialogs
const { data: rolesAndAdminsData, refresh: refreshRolesAndAdmins } = await useFetchRolesAndAdmins();

// Get category ID from folder data
const categoryId = computed(() => folderData.value?.data?.category_id ?? null);

// Fetch category data with reactive category ID
const { assignedRolesToCategory, assignedAdminsToCategory } = useGetCategory(categoryId);

// Extract and format ALL roles and admins
const availableRolesForFolder = computed(() => {
  const response = rolesAndAdminsData.value as { data?: { roles: Array<{ id: number; display_name: string | null }> } };
  const roles = response?.data?.roles || [];

  return roles.map((role) => ({
    id: role.id,
    name: role.display_name || `Role Not Available`,
  }));
});

const availableAdminsForFolder = computed(() => {
  const response = rolesAndAdminsData.value as { data?: { admins: Array<{ id: number; name: string; role_id?: number }> } };
  const admins = response?.data?.admins || [];

  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    role_id: admin.role_id,
  }));
});

// Note: We now get assigned roles/admins directly from folderDetail.roles_has_access and folderDetail.admins_has_access

// Determine viewBy mode based on assigned roles/admins
const folderViewBy = computed(() => {
  if (!folderDetail.value) return "role";

  const hasRoles = folderDetail.value.roles_has_access && folderDetail.value.roles_has_access.length > 0;
  const hasAdmins = folderDetail.value.admins_has_access && folderDetail.value.admins_has_access.length > 0;

  if (hasRoles) return "role";
  if (hasAdmins) return "users";
  return "role"; // default
});

// For refetching categories list after mutations (used by sidebar/listeners)
const { refresh: refreshFetchCategories } = useFetchCategories();

// Data refresh utilities
const { refreshAfterFolderUpdate, refreshAfterFolderDelete, refreshFileData } = useDataRefresh();

// Ensure data is fetched on mount
onMounted(() => {
  if (folderId.value) {
    refreshFolder();
  }
});

const folderName = computed(() => folderDetail.value?.title);

const searchQuery = ref("");

// Watch for files errors
watch(filesError, (err) => {
  if (err) {
    toast.error(t("files.deleteFailed"));
  }
});

const filteredFiles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return files.value;
  return files.value.filter((file) => {
    const en = (file.title_en ?? file.title ?? "").toLowerCase();
    const ar = (file.title_ar ?? "").toLowerCase();
    return en.includes(q) || ar.includes(q);
  });
});

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const handleAddFile = async (
  newFile: { type: string; titleEn: string; titleAr: string; url: string; viewBy: string; roles: string[]; users: string[] },
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  if (!folderId.value || newFile.type !== "file") return;

  try {
    // Convert role names to actual IDs
    let roleIds: number[] | undefined = undefined;
    let adminIds: number[] | undefined = undefined;

    if (newFile.viewBy === "role" && newFile.roles.length > 0) {
      roleIds = newFile.roles.map((roleName) => availableRolesForFolder.value.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];
    }

    if (newFile.viewBy === "users" && newFile.users.length > 0) {
      adminIds = newFile.users.map((userName) => availableAdminsForFolder.value.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];
    }

    const payload = {
      en: { title: newFile.titleEn, description: "" },
      ar: { title: newFile.titleAr, description: "" },
      parent_id: folderId.value,
      role_ids: roleIds,
      admin_ids: adminIds,
    };

    const result = await useCreateFile(payload);

    if (result.error || result.status >= 400) {
      const errorMessage = result.message || t("folders.fileCreationFailed");
      toast.error(errorMessage);
      onError?.(errorMessage);
      return;
    }

    toast.success(t("folders.fileCreated"));

    // Clear cache and refresh folder data after success toast
    if (result.data?.data && result.data.data.length > 0 && result.data.data[0]?.id) {
      await refreshFileData(result.data.data[0].id, folderId.value);
    }
    await refreshFolder();
    onSuccess?.();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : t("folders.fileCreationFailed");
    toast.error(errorMessage);
    onError?.(errorMessage);
  }
};

const handleEditFolder = async (
  updated: { type: string; titleEn: string; titleAr: string; viewBy: string; roles: string[]; users: string[] },
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  if (!folderId.value || !folderDetail.value || updated.type !== "folder") return;

  try {
    let roleIds: number[] | undefined;
    let adminIds: number[] | undefined;

    if (updated.viewBy === "role" && updated.roles.length > 0) {
      roleIds = updated.roles.map((roleName) => availableRolesForFolder.value.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];
    }

    if (updated.viewBy === "users" && updated.users.length > 0) {
      adminIds = updated.users.map((userName) => availableAdminsForFolder.value.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];
    }

    const payload = {
      en: { title: updated.titleEn, description: "" },
      ar: { title: updated.titleAr, description: "" },
      category_id: folderDetail.value.category_id,
      role_ids: roleIds,
      admin_ids: adminIds,
    };

    const result = await useUpdateFolder(folderId.value, payload);

    if (result.error || result.status >= 400) {
      const errorMessage = result.message || t("folders.updateFailed");
      toast.error(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // Refresh all related data using the new composable
    await Promise.all([refreshFolder(), refreshAfterFolderUpdate(folderId.value), refreshFetchCategories()]);

    toast.success(t("folders.folderUpdated"));
    onSuccess?.();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : t("folders.updateFailed");
    toast.error(errorMessage);
    onError?.(errorMessage);
  }
};

const deleteDialogOpen = ref(false);
const handleDeleteFolder = async () => {
  if (!folderId.value) return;

  try {
    const result = await useDeleteFolder(folderId.value);

    if (result.error || result.status >= 400) {
      toast.error(result.message || t("folders.deleteFailed"));
      return;
    }

    // Refresh all related data using the new composable
    await Promise.all([refreshAfterFolderDelete(), refreshFetchCategories()]);

    toast.success(t("folders.folderDeleted"));
    deleteDialogOpen.value = false;

    // Navigate back to parent category or home
    if (folderDetail.value?.category_id) {
      await navigateTo(localePath(`/categories/${folderDetail.value.category_id}`));
    } else {
      await navigateTo(localePath("/"));
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t("folders.deleteFailed"));
  }
};
</script>

<template>
  <div class="p-3 sm:p-4 md:p-6 space-y-5 sm:space-y-6 mb-50">
    <!-- No Permission State -->
    <div v-if="!hasReadPermission" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Folder class="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" />
      <h2 class="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">{{ t("folders.noPermission") }}</h2>
      <p class="text-gray-400 text-sm sm:text-base">{{ t("folders.noPermissionDescription") }}</p>
    </div>

    <!-- Content with Permission -->
    <template v-else>
      <!-- Breadcrumb -->
      <Breadcrumb>
        <BreadcrumbList class="flex flex-wrap gap-1 text-xs sm:text-sm">
          <BreadcrumbItem>{{ t("categories.breadcrumb") }}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem v-if="folderDetail?.category_id && folderDetail?.category_title">
            <NuxtLinkLocale :to="`/categories/${folderDetail.category_id}`">
              {{ folderDetail.category_title }}
            </NuxtLinkLocale>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage class="font-semibold">
              <span v-if="folderName">{{ folderName }}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-lg sm:text-2xl md:text-3xl font-bold leading-tight">
        <span v-if="folderError && !folderForbidden">{{ t("folders.loadError") }}</span>
        <span v-else>{{ folderName }}</span>
      </h1>

      <div v-if="folderDetail" class="flex items-center gap-2 sm:gap-3">
        <ClientOnly>
          <CreateItemDialog
            v-if="folderId && canCreate('files')"
            :dialog-title="t('dialog.create.fileTitle')"
            :name-label="t('dialog.labels.fileName')"
            type="file"
            :roles="assignedRolesToFolder"
            :users="assignedAdminsToFolder"
            @on-add="
              (p, onSuccess, onError) =>
                handleAddFile({ type: p.type, titleEn: p.titleEn, titleAr: p.titleAr, url: p.url, viewBy: p.viewBy, roles: p.roles, users: p.users }, onSuccess, onError)
            "
            @dialog-open="refreshRolesAndAdmins"
          >
            <Button
              size="sm"
              class="rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-lg cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md font-medium"
            >
              <Plus class="h-4 w-4" />
              <span class="hidden lg:inline text-xs lg:text-sm">{{ t("folders.createFile") }}</span>
            </Button>
          </CreateItemDialog>
        </ClientOnly>

        <ClientOnly>
          <EditItemDialog
            v-if="folderId && canUpdate('folders')"
            :dialog-title="t('dialog.edit.folderTitle')"
            :name-label="t('dialog.labels.folderName')"
            type="folder"
            :title-en="folderDetail?.title_en"
            :title-ar="folderDetail?.title_ar"
            :view-by="folderViewBy"
            :roles="assignedRolesToCategory"
            :users="assignedAdminsToCategory"
            :assigned-roles="assignedRolesToFolder"
            :assigned-users="assignedAdminsToFolder"
            @on-edit="
              (p, onSuccess, onError) =>
                handleEditFolder({ type: p.type, titleEn: p.titleEn, titleAr: p.titleAr, viewBy: p.viewBy, roles: p.roles, users: p.users }, onSuccess, onError)
            "
          >
            <Button
              size="sm"
              class="rounded-lg bg-white text-[#0080a5] border border-[#0080a5] hover:bg-[#e6f7fa] hover:border-[#006d8a] hover:text-[#006d8a] cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <SquarePen class="h-4 w-4" />
              <span class="hidden lg:inline text-xs lg:text-sm">{{ t("folders.editFolder") }}</span>
            </Button>
          </EditItemDialog>
        </ClientOnly>

        <Button
          v-if="canDelete('folders')"
          size="sm"
          class="rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          @click="deleteDialogOpen = true"
        >
          <Trash class="h-4 w-4" />
          <span class="hidden lg:inline text-xs lg:text-sm">{{ t("folders.deleteFolder") }}</span>
        </Button>

        <ClientOnly>
          <DeleteItemDialog
            v-model:open="deleteDialogOpen"
            :title="t('dialog.delete.title')"
            :description="t('dialog.delete.folderDescription')"
            :confirm-text="t('dialog.delete.confirm')"
            :cancel-text="t('dialog.buttons.cancel')"
            @confirm="handleDeleteFolder"
          />
        </ClientOnly>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="folderPending" class=""><LoadingSpinner /></div>

    <!-- Forbidden State -->
    <div v-else-if="folderForbidden" class="border border-amber-200 rounded-2xl shadow-sm bg-amber-50">
      <div class="flex items-center justify-center py-12 px-4 text-center">
        <div class="space-y-2">
          <div class="text-amber-700 text-lg font-semibold">{{ t("folders.noAccessTitle") }}</div>
          <div class="text-amber-600 text-sm">{{ t("folders.noAccessDescription") }}</div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="folderError" class="border border-red-200 rounded-2xl shadow-sm bg-red-50">
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="text-red-600 text-lg font-semibold mb-2">{{ t("folders.loadError") }}</div>
          <div class="text-red-500 text-sm">{{ folderError.message || t("folders.loadErrorDescription") }}</div>
          <Button class="mt-4" variant="outline" @click="refreshFolder"> {{ t("search.tryAgain") }} </Button>
        </div>
      </div>
    </div>

    <!-- Files Card -->
    <div v-else class="border border-gray-200 rounded-2xl shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center justify-between border-b px-3 sm:px-4 py-3 gap-3">
        <h2 class="font-semibold text-base sm:text-lg text-primary">{{ t("folders.allFiles") }}</h2>

        <div class="flex items-center relative w-50">
          <Input
            id="search-inline"
            v-model="searchQuery"
            type="text"
            :placeholder="t('folders.search')"
            aria-label="Search files"
            :class="['w-48 sm:w-72 border-[#E5E5E5] placeholder:text-[#A3A3A3]', locale === 'ar' ? 'pe-10' : 'ps-10']"
          />
          <Search :class="['text-[#E5E5E5] !text-sm absolute top-1/2 -translate-y-1/2', locale === 'ar' ? 'end-2' : 'start-2']" aria-hidden="true" />
        </div>
      </div>

      <ul class="divide-y p-1 sm:p-3">
        <li v-if="filesPending" class="relative"><LoadingSpinner /></li>
        <li v-else-if="filesError" class="px-4 py-8 text-red-500 text-sm text-center">{{ t("files.deleteFailed") }}</li>
        <li v-else-if="filteredFiles.length === 0" class="px-4 py-8">
          <div class="flex flex-col items-center justify-center text-center text-gray-400">
            <FileIcon class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
            <h3 class="text-base sm:text-xl font-semibold">{{ t("folders.noFilesFound") }}</h3>
          </div>
        </li>
        <li v-for="file in filteredFiles" v-else :key="file.id" class="hover:bg-gray-50 hover:shadow-sm overflow-hidden transition-all duration-200">
          <NuxtLinkLocale :to="`/files/${file.id}`" class="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 cursor-pointer w-full text-sm sm:text-base">
            <div class="min-w-0 flex items-center gap-2 sm:gap-3">
              <FileIcon class="text-gray-500 shrink-0" />
              <span class="text-gray-700 font-medium truncate">
                {{ locale === "ar" ? file.title_ar || file.title_en || file.title : file.title_en || file.title_ar || file.title }}
              </span>
              <span v-if="file.created_at" class="text-xs text-gray-400 whitespace-nowrap">
                {{ formatDate(file.created_at) }}
              </span>
            </div>
            <ChevronRight class="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          </NuxtLinkLocale>
        </li>
      </ul>
    </div>
    </template>
  </div>
</template>
