<!-- /app/pages/categories/[id]/index.vue -->
<script setup lang="ts">
import { navigateTo } from "#app";
import { useLocalePath } from "#i18n";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteCategory } from "@/composables/categories/useDeleteCategory";
import { useFetchCategories } from "@/composables/categories/useFetchCategories";
import { useGetCategory } from "@/composables/categories/useGetCategory";
import { useUpdateCategory } from "@/composables/categories/useUpdateCategory";
import { useCreateFolder } from "@/composables/folders/useCreateFolder";
import { createError } from "h3";
import { ChevronRight, Folder, Plus, Search, SquarePen, Trash } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import CreateItemDialog from "~/components/global/CreateItemDialog.vue";
import DeleteItemDialog from "~/components/global/DeleteItemDialog.vue";
import EditItemDialog from "~/components/global/EditItemDialog.vue";
import LoadingSpinner from "~/components/LoadingSpinner.vue";
import { useFetchRolesAndAdmins } from "~/composables/roles/useFetchRolesAndAdmins";
import { usePermissions } from "~/composables/usePermissions";

/* ---------- helpers (strict id parsing: empty/invalid -> null, never 0) ---------- */
const idParam = (val: unknown) => String(Array.isArray(val) ? val[0] : val ?? "").trim();

const parseNumericId = (val: unknown): number | null => {
  const s = idParam(val);
  if (!/^\d+$/.test(s)) return null; // reject empty or non-digits
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

definePageMeta({
  key: (route) => idParam(route.params.id),
  middleware: "permission",
});

const route = useRoute();
const { locale, t } = useI18n();
const localePath = useLocalePath();
const { canCreate, canUpdate, canDelete, canRead } = usePermissions();

// Check if user has read permission for categories
const hasReadPermission = canRead("categories");

const categoryId = computed<number | null>(() =>
  parseNumericId((route.params as Record<string, string | string[]>).id ?? (route.params as Record<string, string | string[]>).Id)
);

if (categoryId.value == null) {
  throw createError({ statusCode: 404, statusMessage: "Invalid category id" });
}

// Only fetch category data if user has permission
const { error, refresh, categoryDetail, assignedRolesToCategory, assignedAdminsToCategory } = hasReadPermission
  ? useGetCategory(categoryId.value)
  : {
      error: ref(null),
      refresh: () => Promise.resolve(),
      categoryDetail: ref(null),
      assignedRolesToCategory: ref([]),
      assignedAdminsToCategory: ref([]),
    };

const categoryTitle = computed(() => {
  if (!categoryDetail.value) return "";
  return locale.value === "ar"
    ? categoryDetail.value.title_ar ?? categoryDetail.value.title_en ?? ""
    : categoryDetail.value.title_en ?? categoryDetail.value.title_ar ?? "";
});

// SEO Meta Tags - Dynamic based on category
const config = useRuntimeConfig();
const siteUrl = config.public.apiBase?.replace("/api", "") || "";
const canonicalUrl = computed(() => `${siteUrl}${route.path}`);

const pageTitle = computed(() => {
  if (!categoryTitle.value) return "Category - Kandil Internal Portal";
  return `${categoryTitle.value} - Kandil Internal Portal`;
});

const pageDescription = computed(() => {
  if (!categoryDetail.value) return "View category details and manage folders in Kandil Internal Portal.";
  const title = categoryTitle.value;
  return `View ${title} category details, folders, and manage your documents in Kandil Internal Portal.`;
});

// Structured Data (JSON-LD) for SEO
const structuredData = computed(() => {
  const baseData = {
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
  };

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
  ];

  if (categoryTitle.value) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: categoryTitle.value,
      item: canonicalUrl.value,
    });
  }

  return {
    ...baseData,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
  };
});

// Watch categoryDetail and update meta tags
watch(
  [categoryDetail, categoryTitle, locale],
  () => {
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
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(structuredData.value),
        },
      ],
      htmlAttrs: {
        lang: locale.value || "en",
      },
    });
  },
  { immediate: true, deep: true }
);

// Handle API errors - check immediately and watch for changes (only if user has permission)
const handleCategoryError = (err: unknown) => {
  if (err && hasReadPermission) {
    const statusCode = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { statusCode?: number; status?: number })?.status;
    if (statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: "Category not found" });
    }
  }
};

// Check error immediately (for SSR) - only if user has permission
if (hasReadPermission) {
  handleCategoryError(error.value);
}

// Watch for API errors and throw 404 if resource not found - only if user has permission
if (hasReadPermission) {
  watch(error, handleCategoryError, { immediate: true });
}

// Fetch roles and admins for category creation
const { data: rolesAndAdminsData } = await useFetchRolesAndAdmins();

// Extract and format the data
const availableRolesForCategory = computed(() => {
  const response = rolesAndAdminsData.value as { data?: { roles: Array<{ id: number; display_name: string | null }> } };
  const roles = response?.data?.roles || [];

  return roles.map((role) => ({
    id: role.id,
    name: role.display_name || `Role Not Available`, // Fallback for null display_name
  }));
});

const availableAdminsForCategory = computed(() => {
  const response = rolesAndAdminsData.value as { data?: { admins: Array<{ id: number; name: string; role_id?: number }> } };
  const admins = response?.data?.admins || [];

  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    role_id: admin.role_id,
  }));
});

// Determine viewBy mode based on assigned roles/admins
const categoryViewBy = computed(() => {
  if (!categoryDetail.value) return "role";

  const hasRoles = categoryDetail.value.roles_has_access && categoryDetail.value.roles_has_access.length > 0;
  const hasAdmins = categoryDetail.value.admins_has_access && categoryDetail.value.admins_has_access.length > 0;

  if (hasRoles) return "role";
  if (hasAdmins) return "users";
  return "role"; // default
});

// For refetching categories list after mutations (used by sidebar/listeners)
const { refresh: refreshFetchCategories } = useFetchCategories();

const searchQuery = ref("");
const deleteDialogOpen = ref(false);

const foldersFromDetail = computed(() => categoryDetail.value?.folders ?? []);

const filteredFolders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return foldersFromDetail.value;
  return foldersFromDetail.value.filter((f: { title?: string; title_en?: string; title_ar?: string }) => {
    const en = (f.title_en ?? f.title ?? "").toLowerCase();
    const ar = (f.title_ar ?? "").toLowerCase();
    return en.includes(q) || ar.includes(q);
  });
});

const handleAddFolder = async (
  payload: { titleEn: string; titleAr: string; viewBy: string; roles: string[]; users: string[] },
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  if (!categoryId.value) return;

  // Convert role names to actual IDs
  let roleIds: number[] | undefined = undefined;
  let adminIds: number[] | undefined = undefined;

  if (payload.viewBy === "role" && payload.roles.length > 0) {
    roleIds = payload.roles.map((roleName) => availableRolesForCategory.value.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];
  }

  if (payload.viewBy === "users" && payload.users.length > 0) {
    adminIds = payload.users.map((userName) => availableAdminsForCategory.value.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];
  }

  const res = await useCreateFolder({
    category_id: categoryId.value,
    en: { title: payload.titleEn },
    ar: { title: payload.titleAr },
    role_ids: roleIds,
    admin_ids: adminIds,
  });

  if (res.error || (res.status && res.status >= 400)) {
    const errorMessage = res.message || t("categories.folderCreationFailed");
    toast.error(errorMessage);
    onError?.(errorMessage);
    return;
  }

  await refresh();
  toast.success(res.message || t("categories.folderCreated"));
  onSuccess?.();
};

const handleEdit = async (
  payload: { titleEn: string; titleAr: string; viewBy: string; roles: string[]; users: string[] },
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  if (!categoryId.value) return;

  let roleIds: number[] | undefined;
  let adminIds: number[] | undefined;

  if (payload.viewBy === "role" && payload.roles.length > 0) {
    roleIds = payload.roles.map((roleName) => availableRolesForCategory.value.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];
  }

  if (payload.viewBy === "users" && payload.users.length > 0) {
    adminIds = payload.users.map((userName) => availableAdminsForCategory.value.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];
  }

  const res = await useUpdateCategory(categoryId.value, {
    en: { title: payload.titleEn },
    ar: { title: payload.titleAr },
    role_ids: roleIds,
    admin_ids: adminIds,
  });
  if (res.error || (res.status && res.status >= 400)) {
    const errorMessage = res.message || t("categories.updateFailed");
    toast.error(errorMessage);
    onError?.(errorMessage);
    return;
  }
  await Promise.all([refresh(), refreshFetchCategories()]);
  toast.success(t("categories.categoryUpdated"));
  onSuccess?.();
};

const handleDelete = async () => {
  if (!categoryId.value) return;
  const res = await useDeleteCategory(categoryId.value);
  if (res.error || (res.status && res.status >= 400)) {
    toast.error(res.message || t("categories.deleteFailed"));
    return;
  }
  toast.success(res.message || t("categories.categoryDeleted"));
  deleteDialogOpen.value = false;
  await Promise.all([navigateTo(localePath("/")), refreshFetchCategories()]);
};

const isReady = computed(() => Boolean(categoryDetail.value));
</script>

<template>
  <div class="p-3 sm:p-4 md:p-6 mb-50">
    <!-- No Permission State -->
    <div v-if="!hasReadPermission" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Folder class="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" />
      <h2 class="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">{{ t("categories.noPermission") }}</h2>
      <p class="text-gray-400 text-sm sm:text-base">{{ t("categories.noPermissionDescription") }}</p>
    </div>

    <div v-else-if="!isReady" class=""><LoadingSpinner /></div>

    <div v-else class="space-y-5 sm:space-y-6 mb-14">
      <Breadcrumb>
        <BreadcrumbList class="flex flex-wrap gap-1 text-xs sm:text-sm">
          <BreadcrumbItem>{{ t("categories.breadcrumb") }}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage class="font-semibold">
              <span>{{ t(categoryTitle) }}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div class="flex items-center justify-between">
        <h1 class="text-lg sm:text-2xl md:text-3xl font-bold leading-tight">{{ t(categoryTitle) }}</h1>
        <div class="flex items-center gap-2 sm:gap-3">
          <ClientOnly>
            <CreateItemDialog
              v-if="categoryId && canCreate('folders')"
              :dialog-title="t('dialog.create.folderTitle')"
              :name-label="t('dialog.labels.folderName')"
              type="folder"
              :roles="assignedRolesToCategory"
              :users="assignedAdminsToCategory"
              @on-add="
                (p, onSuccess, onError) =>
                  handleAddFolder({ titleEn: p.titleEn, titleAr: p.titleAr, viewBy: p.viewBy, roles: p.roles, users: p.users }, onSuccess, onError)
              "
            >
              <Button
                size="sm"
                class="rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-lg cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md font-medium"
              >
                <Plus class="h-4 w-4" />
                <span class="hidden lg:inline text-xs lg:text-sm">{{ t("categories.createFolder") }}</span>
              </Button>
            </CreateItemDialog>
          </ClientOnly>

          <ClientOnly>
            <EditItemDialog
              v-if="categoryId && canUpdate('categories')"
              :dialog-title="t('dialog.edit.categoryTitle')"
              :name-label="t('dialog.labels.categoryName')"
              type="category"
              :title-en="categoryDetail?.title_en ?? ''"
              :title-ar="categoryDetail?.title_ar ?? ''"
              :view-by="categoryViewBy"
              :roles="availableRolesForCategory"
              :users="availableAdminsForCategory"
              :assigned-roles="assignedRolesToCategory"
              :assigned-users="assignedAdminsToCategory"
              @on-edit="
                (p, onSuccess, onError) => handleEdit({ titleEn: p.titleEn, titleAr: p.titleAr, viewBy: p.viewBy, roles: p.roles, users: p.users }, onSuccess, onError)
              "
            >
              <Button
                size="sm"
                class="rounded-lg bg-white text-[#0080a5] border border-[#0080a5] hover:bg-[#e6f7fa] hover:border-[#006d8a] hover:text-[#006d8a] cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <SquarePen class="h-4 w-4" />
                <span class="hidden lg:inline text-xs lg:text-sm">{{ t("categories.editCategory") }}</span>
              </Button>
            </EditItemDialog>
          </ClientOnly>

          <Button
            v-if="canDelete('categories')"
            size="sm"
            class="rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            @click="deleteDialogOpen = true"
          >
            <Trash class="h-4 w-4" />
            <span class="hidden lg:inline text-xs lg:text-sm">{{ t("categories.deleteCategory") }}</span>
          </Button>

          <ClientOnly>
            <DeleteItemDialog
              v-model:open="deleteDialogOpen"
              :title="t('dialog.delete.title')"
              :description="t('dialog.delete.categoryDescription')"
              :confirm-text="t('dialog.delete.confirm')"
              :cancel-text="t('dialog.delete.cancel')"
              type="category"
              @confirm="handleDelete"
            />
          </ClientOnly>
        </div>
      </div>

      <div class="border border-gray-200 rounded-2xl shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between border-b px-3 sm:px-4 py-3 gap-3">
          <h2 class="font-semibold text-base sm:text-lg text-primary">{{ t("categories.allFolders") }}</h2>
          <div class="flex items-center relative w-50">
            <Input
              id="search-inline"
              v-model="searchQuery"
              type="text"
              :placeholder="t('categories.search')"
              aria-label="Search folders"
              :class="['w-48 sm:w-72 border-[#E5E5E5] placeholder:text-[#A3A3A3]', locale === 'ar' ? 'pe-10' : 'ps-10']"
            />
            <Search :class="['text-[#E5E5E5] !text-sm absolute top-1/2 -translate-y-1/2', locale === 'ar' ? 'end-2' : 'start-2']" aria-hidden="true" />
          </div>
        </div>

        <ul class="divide-y p-1 sm:p-3">
          <li v-for="folder in filteredFolders" :key="folder.id" class="hover:bg-gray-50 hover:shadow-sm overflow-hidden transition-all duration-200">
            <NuxtLinkLocale class="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 cursor-pointer w-full text-sm sm:text-base" :to="`/folders/${folder.id}`">
              <div class="min-w-0 flex items-center gap-2 sm:gap-3">
                <span class="text-gray-700 font-medium truncate max-w-[60vw] sm:max-w-[28rem]">
                  {{ t(folder.title) }}
                </span>
                <span v-if="folder.created_at" class="text-xs text-gray-400 whitespace-nowrap"> {{ folder.created_at }} </span>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <ChevronRight class="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              </div>
            </NuxtLinkLocale>
          </li>

          <li v-if="filteredFolders.length === 0" class="px-4 py-8">
            <div class="flex flex-col items-center justify-center text-center text-gray-400">
              <Folder class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
              <h3 class="text-base sm:text-xl font-semibold">{{ t("categories.noFoldersFound") }}</h3>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
