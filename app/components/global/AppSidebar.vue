<!-- app/components/global/AppSidebar.vue -->
<script setup lang="ts">
import { ClientOnly } from "#components";
import { useLocalePath } from "#i18n";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useCreateCategory } from "@/composables/categories/useCreateCategory";
import { useFetchCategories } from "@/composables/categories/useFetchCategories";
import { ChevronDown, CirclePlus, FolderClosed, House, Lock, Trash2 } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import LoadingSpinner from "~/components/LoadingSpinner.vue";
import { useFetchRolesAndAdmins } from "~/composables/roles/useFetchRolesAndAdmins";
import { usePermissions } from "~/composables/usePermissions";
import CreateItemDialog from "./CreateItemDialog.vue";
defineOptions({ inheritAttrs: false });
const modelCollapsed = defineModel<boolean>("is-collapsed", { default: false });

const route = useRoute();
const localePath = useLocalePath();
const { locale, t } = useI18n();
const { canCreate, canRead } = usePermissions();

// Computed property for RTL support
const isRtl = computed(() => locale.value === "ar");
const borderClass = computed(() => (isRtl.value ? "border-l" : "border-r"));

const isOpen = ref(true);
const toggle = () => (isOpen.value = !isOpen.value);

const { data: categoriesData, pending: loading, refresh } = useFetchCategories();
const categories = computed(() => categoriesData.value?.data || []);

// Fetch roles and admins for category creation
const { data: rolesAndAdminsData, refresh: refreshRolesAndAdmins } = await useFetchRolesAndAdmins();

// Extract and format the data
const availableRoles = computed(() => {
  const response = rolesAndAdminsData.value as { data?: { roles: Array<{ id: number; display_name: string | null }> } };
  const roles = response?.data?.roles || [];

  return roles.map((role) => ({
    id: role.id,
    name: role.display_name || `Role Not Available`, // Fallback for null display_name
  }));
});

const availableAdmins = computed(() => {
  const response = rolesAndAdminsData.value as { data?: { admins: Array<{ id: number; name: string }> } };
  const admins = response?.data?.admins || [];

  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
  }));
});

const handleAddCategory = async (
  payload: { titleEn: string; titleAr: string; roles: string[]; users: string[] },
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  // Convert role names to IDs
  const roleIds = payload.roles.map((roleName) => availableRoles.value.find((role) => role.name === roleName)?.id).filter((id) => id !== undefined) as number[];

  // Convert user names to IDs
  const adminIds = payload.users.map((userName) => availableAdmins.value.find((admin) => admin.name === userName)?.id).filter((id) => id !== undefined) as number[];

  const res = await useCreateCategory({
    en: { title: payload.titleEn },
    ar: { title: payload.titleAr },
    role_ids: roleIds.length > 0 ? roleIds : undefined,
    admin_ids: adminIds.length > 0 ? adminIds : undefined,
  });

  if (res.error || (res.status && res.status >= 400)) {
    const errorMessage = res.message || "Create failed";
    toast.error(errorMessage);
    onError?.(errorMessage);
    return;
  }

  await refresh();
  toast.success(res.message || "Category created");
  onSuccess?.();
};

const isActiveExact = (path: string) => route.path.replace(/\/+$/, "") === path.replace(/\/+$/, "");
const isActiveDeep = (path: string) => {
  const base = path.replace(/\/+$/, "");
  const current = route.path.replace(/\/+$/, "");
  return current === base || current.startsWith(base + "/");
};

/** Localize BEFORE navigation and build locale-aware href to pages/[category]/index.vue */
const localizedCategories = computed(() =>
  categories.value.map((c) => {
    const title = locale.value === "ar" ? c.title_ar ?? c.title_en ?? "" : c.title_en ?? c.title_ar ?? "";
    const href = localePath(`/categories/${c.id}`);
    return { id: c.id, title, href };
  })
);

watch(
  () => locale.value,
  () => {
    refresh();
  }
);
</script>

<template>
  <div
    v-bind="$attrs"
    :class="['h-full overflow-hidden', modelCollapsed ? '!border-0 pointer-events-none' : `${borderClass} border-gray-200`]"
    :aria-hidden="modelCollapsed ? 'true' : undefined"
    :tabindex="modelCollapsed ? -1 : undefined"
  >
    <ClientOnly>
      <div class="h-full w-full flex flex-col bg-white relative">
        <!-- اترك Sidebar بعرضه الطبيعي (w-(--sidebar-width) داخلياً) -->
        <Sidebar class="flex flex-col h-full min-h-0" :class="isRtl ? 'border-l-0' : 'border-r-0'">
          <SidebarContent class="flex flex-col h-full min-h-0 bg-white relative" :class="isRtl ? 'border-l-0' : 'border-r-0'">
            <!-- Scrollable area starting from home button -->
            <div class="flex-1 max-h-[calc(100vh-150px)] overflow-y-auto pb-44 scrollbar">
              <nav aria-label="Main navigation" class="px-4 pt-4">
                <NuxtLinkLocale
                  to="/"
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#404040] hover:text-primary transition-colors h-11 sm:h-8"
                  :class="isActiveExact(localePath('/')) ? 'bg-primary/10 text-primary font-medium' : ''"
                  :aria-current="isActiveExact(localePath('/')) ? 'page' : undefined"
                >
                  <House class="h-4 w-4" aria-hidden="true" /> {{ t("sidebar.home") }}
                </NuxtLinkLocale>
              </nav>

              <template v-if="canRead('categories')">
                <nav aria-label="Categories navigation" class="px-4 mt-2">
                  <button
                    class="flex justify-between items-center w-full px-3 py-2 text-[#404040] hover:text-primary hover:bg-gray-100 rounded-md text-sm transition-colors h-11 sm:h-8"
                    :aria-expanded="isOpen"
                    :aria-label="isOpen ? t('sidebar.collapseCategories') || 'Collapse categories' : t('sidebar.expandCategories') || 'Expand categories'"
                    @click="toggle"
                  >
                    <span class="flex items-center gap-3"> <FolderClosed class="h-4 w-4" aria-hidden="true" /> {{ t("sidebar.categories") }} </span>
                    <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': isOpen }" aria-hidden="true" />
                  </button>
                </nav>

                <div class="px-4">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <ul v-show="isOpen" class="pb-5 space-y-1 text-sm" :class="isRtl ? 'pe-6' : 'ps-6'" role="list" aria-label="Category list">
                      <!-- Loading / Error states -->
                      <li v-if="loading" class="pb-20"><LoadingSpinner /></li>
                      <li v-else-if="/* keep slot in DOM for transitions */ false" class="hidden" />
                      <li v-else-if="!loading && !localizedCategories.length" class="px-3 py-2 text-sm text-gray-500">{{ t("sidebar.noCategoriesAvailable") }}</li>

                      <li v-for="cat in localizedCategories" v-else :key="cat.id" role="listitem">
                        <NuxtLink
                          :to="cat.href"
                          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#404040] hover:text-primary hover:bg-primary/5 transition-colors border-b h-11 sm:h-8"
                          :class="isActiveDeep(cat.href) ? 'bg-primary/10 text-primary font-medium border-b-primary border-b-1' : ''"
                          :aria-current="isActiveDeep(cat.href) ? 'page' : undefined"
                        >
                          {{ cat.title }}
                        </NuxtLink>
                      </li>
                    </ul>
                  </transition>
                </div>
              </template>
            </div>

            <!-- Bottom fixed zone with three buttons -->
            <div class="absolute bottom-0 left-0 right-0 bg-white border-t shadow-sm z-10">
              <div class="px-4 py-3 space-y-1">
                <CreateItemDialog
                  v-if="canCreate('categories')"
                  :dialog-title="t('sidebar.createNewCategory')"
                  :name-label="t('sidebar.categoryName')"
                  type="category"
                  :roles="availableRoles"
                  :users="availableAdmins"
                  @on-add="(p, onSuccess, onError) => handleAddCategory({ titleEn: p.titleEn, titleAr: p.titleAr, roles: p.roles, users: p.users }, onSuccess, onError)"
                  @dialog-open="refreshRolesAndAdmins"
                >
                  <div class="flex items-center gap-3 px-3 py-2 text-primary text-sm rounded-md hover:bg-primary/5 cursor-pointer transition-colors h-11 sm:h-8">
                    <CirclePlus class="h-4 w-4" aria-hidden="true" /> {{ t("sidebar.addNewCategory") }}
                  </div>
                </CreateItemDialog>

                <NuxtLinkLocale
                  v-if="canRead('roles')"
                  to="permissions"
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#737373] hover:bg-[#737373]/5 transition-colors"
                  :class="isActiveDeep(localePath('/permissions')) ? 'bg-[#737373]/10 font-medium' : ''"
                >
                  <Lock class="h-4 w-4" aria-hidden="true" /> {{ t("sidebar.rolesAndPermissions") }}
                </NuxtLinkLocale>

                <NuxtLinkLocale
                  v-if="canRead('recycleBin')"
                  to="recycle-bin"
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#DC2626] hover:bg-[#DC2626]/5 transition-colors h-11 sm:h-8"
                  :class="isActiveDeep(localePath('/recycle-bin')) ? 'bg-[#DC2626]/10 font-medium' : ''"
                  :aria-current="isActiveDeep(localePath('/recycle-bin')) ? 'page' : undefined"
                >
                  <Trash2 class="h-4 w-4" aria-hidden="true" /> {{ t("sidebar.recycleBin") }}
                </NuxtLinkLocale>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
      </div>

      <template #fallback>
        <div class="h-full w-full bg-white" />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.scrollbar::-webkit-scrollbar {
  width: 1.5px; /* scrollbar width */
}

.scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1; /* track color */
  border-radius: 8px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background: #7a7a7a; /* thumb color */
  border-radius: 8px;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
  background: #7a7a7a;
}
</style>
