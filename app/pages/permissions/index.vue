<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import LoadingSpinner from "~/components/LoadingSpinner.vue";
import AddNewRole from "~/components/permissions/AddNewRole.vue";
import AddNewUser from "~/components/permissions/AddNewUser.vue";
import BaseTable from "~/components/permissions/BaseTable.vue";
import BulkUserAction from "~/components/permissions/BulkUserAction.vue";
import EditUserDialog from "~/components/permissions/EditUserDialog.vue";
import { useFetchAdmins } from "~/composables/admins/useFetchAdmins";
import { UseAssignRole } from "~/composables/roles/UseAssignRole";
import { useFetchRoles } from "~/composables/roles/useFetchRoles";
import { getStatusCode, isInactiveStatus, useChangeStatus } from "~/composables/settings/useChangeStatus";
import { usePermissions } from "~/composables/usePermissions";
import type { RoleDisplay, UserRow } from "~/data/permissions";
import type { ApiError, EditingRole } from "~~/types/role";

definePageMeta({
  middleware: "permission",
});

const { t } = useI18n();
const { canCreate, canUpdate, canDelete } = usePermissions();

/* state */
const users = ref<UserRow[]>([]);
const roles = ref<RoleDisplay[]>([]);

/* pagination & search */
const currentPage = ref(1);
const perPage = ref(5);
// removed unused totalUsers and loading

/* API */
const { data: adminsData, pending: isLoading, error: _adminsError, refresh } = useFetchAdmins();
const { data: rolesData, pending: isLoadingRoles, refresh: refreshRoles } = useFetchRoles();

const searchQuery = ref("");
const activeTab = ref("users");

const editingRole = ref<EditingRole | null>(null);
const addNewUserRef = ref<InstanceType<typeof AddNewUser> | null>(null);
const editUserDialogRef = ref<InstanceType<typeof EditUserDialog> | null>(null);

/* selection */
const selectedUserIds = ref<string[]>([]);
const selectedRoleIds = ref<string[]>([]);

/* user actions */
const handleEditUser = (row: UserRow) => {
  const userForDialog = {
    ...row,
    deleted: row.status ? isInactiveStatus(row.status) : false,
  };
  editUserDialogRef.value?.open(userForDialog);
};

const handleUserSuccess = async () => {
  await fetchUsers();
};

const handleUserError = (message: string) => {
  toast.error(message || t("permissions.user.toast.operationFailed"));
};

/* role actions (unchanged) */
const handleEditRole = (row: RoleDisplay) => {
  editingRole.value = { ...row };
};

const handleSaveRole = async () => {
  // Refetch roles from API after role creation/update
  await fetchRoles();
  editingRole.value = null;
};

/* disable/restore + bulk logic (unchanged) */
const handleDelete = async (row: UserRow | RoleDisplay, type: "user" | "role") => {
  if (type === "user") {
    try {
      const userRow = row as UserRow;
      // Always send status: 2 to disable (Inactive/غير نشط)
      const statusCode = userRow.status ? getStatusCode("Inactive") : 2;
      const result = await useChangeStatus({
        model_name: "Admin",
        model_id: parseInt(row.id.replace("#", "")),
        status: statusCode,
      });
      if (result.error) throw result.error;
      await fetchUsers();
      toast.success(t("permissions.user.toast.disabledSuccess"));
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(t("permissions.user.toast.disableFailed"), { description: apiError?.message });
    }
  } else {
    roles.value = roles.value.filter((r: RoleDisplay) => r.id !== row.id);
  }
};

const handleRestore = async (row: UserRow) => {
  try {
    // Always send status: 1 to restore (Active/نشط)
    const statusCode = row.status ? getStatusCode("Active") : 1;
    const result = await useChangeStatus({
      model_name: "Admin",
      model_id: parseInt(row.id.replace("#", "")),
      status: statusCode,
    });
    if (result.error) throw result.error;
    await fetchUsers();
    toast.success(t("permissions.user.toast.restoredSuccess"));
  } catch (error: unknown) {
    const apiError = error as ApiError;
    toast.error(t("permissions.user.toast.restoreFailed"), { description: apiError?.message });
  }
};

const handleAssignRole = async (payload: { userIds: string[]; role_id: number }) => {
  const { userIds, role_id } = payload;
  const admin_ids = userIds.map((id) => parseInt(id.replace("#", ""))).filter((n) => !Number.isNaN(n));

  try {
    const { error } = await UseAssignRole({ role_id, admin_ids });
    if (error) throw error;

    await fetchUsers();
    const role = rolesData.value?.data?.find((r) => r.id === role_id);
    const roleName = role?.name || t("permissions.unknownRole");

    selectedUserIds.value = [];
    toast.success(t("permissions.role.toast.roleAssignedTo", { roleName, count: admin_ids.length }));
  } catch (error: unknown) {
    const apiError = error as ApiError;
    toast.error(t("permissions.role.toast.assignFailed"), { description: apiError?.message || (apiError?.data as string) });
  }
};

const selectedUsersAreInactive = computed(() => {
  if (selectedUserIds.value.length === 0) return false;
  return selectedUserIds.value.some((id) => {
    const user = users.value.find((u: UserRow) => u.id === id);
    return user?.status ? isInactiveStatus(user.status) : false;
  });
});

/* API functions */
const fetchUsers = async () => {
  try {
    await refresh();
    const list = adminsData.value?.data || [];
    users.value = list.map((admin: { id: number; name: string; email: string; role?: string; status: "Active" | "Inactive" }) => ({
      id: `#${admin.id}`,
      name: admin.name,
      email: admin.email,
      role: admin.role || t("permissions.notAssigned"),
      status: admin.status,
    }));
  } catch (error: unknown) {
    const apiError = error as ApiError;
    toast.error(t("permissions.user.toast.fetchFailed"), {
      description: apiError?.message || t("permissions.user.toast.couldNotLoad"),
    });
  }
};

const fetchRoles = async () => {
  try {
    await refreshRoles();
    const list = rolesData.value?.data || [];
    roles.value = list.map((role: { id: number; name: string; permissions?: unknown[]; count_users?: number }) => ({
      id: `#${role.id}`,
      name: role.name,
      permissions: role.permissions?.length || 0,
      users: role.count_users || 0,
    }));
  } catch (error: unknown) {
    const apiError = error as ApiError;
    toast.error(t("permissions.role.toast.fetchFailed"), {
      description: apiError?.message || t("permissions.role.toast.couldNotLoad"),
    });
  }
};

/* watchers */
watch(searchQuery, () => {
  currentPage.value = 1;
});

watch([currentPage, perPage], () => {
  fetchUsers();
});

onMounted(() => {
  fetchUsers();
  fetchRoles();
});

/* pagination handlers */
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  currentPage.value = 1;
};

/* filters (unchanged) */
const allFilteredUsers = computed(() => {
  const q = (searchQuery.value || "").toLowerCase();
  return users.value.filter(
    (u: UserRow) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q) || u.status.toLowerCase().includes(q)
  );
});

const filteredUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return allFilteredUsers.value.slice(start, end);
});

const totalUsersComputed = computed(() => allFilteredUsers.value.length);

const filteredRoles = computed(() =>
  roles.value.filter((r: RoleDisplay) => {
    const q = searchQuery.value.toLowerCase();
    return r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.permissions.toString().includes(q) || r.users.toString().includes(q);
  })
);

// Translated column definitions
const translatedUserColumns = computed(() => [
  { key: "id", label: t("permissions.table.columns.userId") },
  { key: "name", label: t("permissions.table.columns.name") },
  { key: "email", label: t("permissions.table.columns.email") },
  { key: "role", label: t("permissions.table.columns.role") },
  { key: "status", label: t("permissions.table.columns.status") },
]);

const translatedRoleColumns = computed(() => [
  { key: "id", label: t("permissions.table.columns.roleId") },
  { key: "name", label: t("permissions.table.columns.roleName") },
  { key: "permissions", label: t("permissions.table.columns.permissions") },
  { key: "users", label: t("permissions.table.columns.users") },
]);
</script>

<template>
  <section class="my-8 pb-16 min-h-screen mb-50">
    <div class="w-full flex items-center justify-between py-5 px-3 sm:px-4 md:px-5">
      <h3 class="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold">{{ t("permissions.title") }}</h3>
      <div class="flex items-center gap-2">
        <!-- Users tab -->
        <template v-if="activeTab === 'users'">
          <BulkUserAction
            v-if="canUpdate('roles')"
            :selected-user-ids="selectedUserIds"
            :selected-users-are-inactive="selectedUsersAreInactive"
            @assign-role="handleAssignRole"
            @refresh="fetchUsers"
          />

          <AddNewUser v-if="canCreate('roles')" ref="addNewUserRef" @success="handleUserSuccess" @error="handleUserError" />
          <EditUserDialog ref="editUserDialogRef" @success="handleUserSuccess" @error="handleUserError" />
        </template>

        <!-- Roles tab -->
        <template v-else-if="activeTab === 'roles'">
          <AddNewRole v-if="canCreate('roles')" @save="handleSaveRole">
            <Button variant="default" class="bg-primary text-white font-normal !px-4 cursor-pointer"> <Plus /> {{ t("permissions.newRole") }} </Button>
          </AddNewRole>
        </template>
      </div>
    </div>

    <div class="bg-white py-4 rounded-md mt-3 shadow-sm">
      <Tabs v-model="activeTab" default-value="users" class="w-full">
        <div class="flex items-center justify-between px-5 pb-3 border-b border-[#E5E5E5]" :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
          <TabsList class="bg-white" :class="$i18n.locale === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'">
            <TabsTrigger value="users" class="py-4 px-3 cursor-pointer !rounded-sm text-[#262626] data-[state=active]:bg-[#E9FBFF] data-[state=active]:text-[#007795]">
              {{ t("permissions.tabs.users") }}
            </TabsTrigger>
            <TabsTrigger value="roles" class="py-4 px-3 cursor-pointer !rounded-sm text-[#262626] data-[state=active]:bg-[#E9FBFF] data-[state=active]:text-[#007795]">
              {{ t("permissions.tabs.roles") }}
            </TabsTrigger>
          </TabsList>

          <!-- search -->
          <div class="flex items-center gap-2">
            <div class="flex items-center relative w-50">
              <Input
                id="search"
                v-model="searchQuery"
                type="text"
                :placeholder="t('permissions.searchPlaceholder')"
                :class="['w-48 sm:w-72 border-[#E5E5E5] placeholder:text-[#A3A3A3]', $i18n.locale === 'ar' ? 'pe-10 text-right' : 'ps-10 text-left']"
              />
              <Search class="text-[#E5E5E5] !text-sm absolute top-1/2 -translate-y-1/2" :class="$i18n.locale === 'ar' ? 'end-2' : 'start-2'" />
            </div>
          </div>
        </div>

        <div class="px-5 py-2 text-sm text-gray-600">
          <span> {{ t("permissions.selected") }} ({{ activeTab === "users" ? selectedUserIds.length : selectedRoleIds.length }}) </span>
        </div>

        <!-- Users -->
        <TabsContent value="users" class="mt-2">
          <div v-if="isLoading" class="relative flex items-center justify-center py-8 h-[150px]"><LoadingSpinner /></div>
          <BaseTable
            v-else
            :columns="translatedUserColumns"
            :rows="filteredUsers"
            :selected-ids="selectedUserIds"
            :total="totalUsersComputed"
            :current-page="currentPage"
            :per-page="perPage"
            role-tag="users"
            :can-edit="canUpdate('roles')"
            :can-delete="canUpdate('roles')"
            @edit="handleEditUser"
            @delete="(row) => handleDelete(row, 'user')"
            @restore="handleRestore"
            @select="(ids:string[]) => (selectedUserIds = ids)"
            @page-change="handlePageChange"
            @per-page-change="handlePerPageChange"
          />
        </TabsContent>

        <!-- Roles -->
        <TabsContent value="roles" class="mt-2">
          <div v-if="isLoadingRoles" class="relative flex items-center justify-center py-8 h-[150px]"><LoadingSpinner /></div>
          <BaseTable
            v-else
            :columns="translatedRoleColumns"
            :rows="filteredRoles"
            :selected-ids="selectedRoleIds"
            role-tag="roles"
            :can-edit="canUpdate('roles')"
            :can-delete="canDelete('roles')"
            @edit="handleEditRole"
            @delete="(row) => handleDelete(row, 'role')"
            @select="(ids:string[]) => (selectedRoleIds = ids)"
            @role-deleted="fetchRoles"
            @role-updated="fetchRoles"
          />
        </TabsContent>
      </Tabs>
    </div>
  </section>
</template>
