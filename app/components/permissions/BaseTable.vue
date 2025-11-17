<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Pencil, Search } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { useDeleteRole } from "~/composables/roles/useDeleteRole";
import { isInactiveStatus } from "~/composables/settings/useChangeStatus";
import { useDataRefresh } from "~/composables/useDataRefresh";
import LoadingSpinner from "../LoadingSpinner.vue";
import { Input } from "../ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import DeleteDialog from "./DeleteDialog.vue";
import UpdateRoleDialog from "./UpdateRoleDialog.vue";
const { t, locale } = useI18n();

const isRtl = computed(() => locale.value === "ar");

const props = defineProps<{
  columns: { key: string; label: string }[];
  rows: any[];
  roleTag: "users" | "roles";
  selectedIds?: string[];
  total?: number;
  currentPage?: number;
  perPage?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit" | "delete" | "restore", row: any): void;
  (e: "select", ids: string[]): void;
  (e: "page-change" | "per-page-change", value: number): void;
  (e: "role-deleted" | "role-updated"): void;
}>();

const perPage = ref(props.perPage ?? 5);
const currentPage = ref(props.currentPage || 1);
const isDeleting = ref(false);
const isEditing = ref(false);

const { refreshRolesAndAdmins } = useDataRefresh();

const paginatedRows = computed(() => {
  if (props.total !== undefined) {
    return props.rows;
  }
  const start = (currentPage.value - 1) * perPage.value;
  return props.rows.slice(start, start + perPage.value);
});

const totalItems = computed(() => props.total || props.rows.length);
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const selected = ref<string[]>([]);
const allRowsIds = computed(() => props.rows.map((row) => row.id as string));

const allSelected = computed(() => allRowsIds.value.length > 0 && allRowsIds.value.every((id) => selected.value.includes(id)));
const someSelected = computed(() => allRowsIds.value.some((id) => selected.value.includes(id)) && !allSelected.value);

const toggleSelectAll = (checked: boolean) => {
  selected.value = checked ? [...allRowsIds.value] : [];
  emit("select", selected.value);
};

const toggleRowSelection = (id: string, checked: boolean) => {
  if (checked) {
    if (!selected.value.includes(id)) selected.value.push(id);
  } else {
    selected.value = selected.value.filter((i) => i !== id);
  }
  emit("select", selected.value);
};

const isSelected = (id: string) => selected.value.includes(id);

// Watchers
watch(perPage, (newPerPage) => {
  currentPage.value = 1;
  emit("per-page-change", newPerPage);
});

watch(currentPage, (newPage) => {
  emit("page-change", newPage);
});

watch(
  () => props.selectedIds,
  (newSelectedIds) => {
    if (newSelectedIds !== undefined) selected.value = [...newSelectedIds];
  },
  { immediate: true }
);

watch(
  () => props.currentPage,
  (newPage) => {
    if (newPage !== undefined) currentPage.value = newPage;
  }
);

watch(
  () => props.perPage,
  (newPerPage) => {
    if (typeof newPerPage === "number" && !Number.isNaN(newPerPage)) {
      perPage.value = newPerPage;
    }
  }
);

// Event handlers
const onSelectAllChange = (evt: Event) => {
  const input = evt.target as HTMLInputElement;
  toggleSelectAll(input.checked);
};

const onRowCheckboxChange = (id: string, evt: Event) => {
  const input = evt.target as HTMLInputElement;
  toggleRowSelection(id, input.checked);
};

const handleRoleDelete = async (row: any) => {
  if (props.roleTag === "roles") {
    try {
      isDeleting.value = true;
      const roleId = parseInt(row.id.replace("#", ""));
      const { data, error } = await useDeleteRole(roleId);

      if (error) {
        toast.error(t("permissions.role.toast.deleteFailed"), {
          description: (error as { message?: string })?.message || t("permissions.role.toast.couldNotDelete"),
        });
        return;
      }

      if ((data as { status_code?: number })?.status_code === 200 || (data as { status_code?: number })?.status_code === 204) {
        toast.success(t("permissions.role.toast.deletedSuccess"));
        await refreshRolesAndAdmins();
        emit("role-deleted");
      } else {
        toast.error(t("permissions.role.toast.deleteFailed"));
      }
    } catch (error: unknown) {
      const errorMessage = error as { message?: string } | null;
      toast.error(t("permissions.role.toast.unexpectedError"), {
        description: errorMessage?.message || t("permissions.role.toast.couldNotDelete"),
      });
    } finally {
      isDeleting.value = false;
    }
  } else {
    emit("delete", row);
  }
};

const handleRoleUpdate = () => {
  emit("role-updated");
};

const handleEditClick = async (row: any) => {
  try {
    isEditing.value = true;
    if (props.roleTag === "roles") {
      // UpdateRoleDialog handles the edit
    } else {
      emit("edit", row);
    }
  } catch (error: unknown) {
    const errorMessage = error as { message?: string } | null;
    toast.error(errorMessage?.message || t("permissions.role.toast.unexpectedError"));
  } finally {
    isEditing.value = false;
  }
};
</script>

<template>
  <div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm" :dir="isRtl ? 'rtl' : 'ltr'">
        <thead class="bg-[#F2F2F2] text-center text-[#0A0A0A]">
          <tr>
            <!-- select all -->
            <th class="p-3 text-start ps-6">
              <Input
                type="checkbox"
                class="h-4 w-4 cursor-pointer !border-none !outline-0 ring-0 !focus:ring-0 accent-[#000] !bg-[#000]"
                :checked="allSelected"
                :indeterminate="!allSelected && someSelected"
                @change="onSelectAllChange"
              />
            </th>
            <th v-for="col in props.columns" :key="col.key" class="p-3 text-start ps-12">
              {{ col.label }}
            </th>
            <th class="pe-10 text-end" />
          </tr>
        </thead>

        <tbody>
          <!-- No results row -->
          <tr v-if="props.rows.length === 0" class="border-t border-[#E5E5E5]">
            <td :colspan="props.columns.length + 2" class="p-12 text-center text-gray-500">
              <div class="flex flex-col items-center gap-3">
                <Search class="h-12 w-12 text-gray-300" />
                <div class="text-lg font-medium text-gray-600">{{ t("permissions.table.noResults") }}</div>
                <div class="text-sm text-gray-400">{{ t("permissions.table.tryAdjusting") }}</div>
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-for="row in paginatedRows"
            v-else
            :key="row.id"
            class="border-t border-[#E5E5E5] hover:bg-gray-50 whitespace-nowrap"
            :class="{ 'opacity-50 bg-gray-100': row.status && isInactiveStatus(row.status) }"
          >
            <!-- row checkbox -->
            <td class="p-3 text-start ps-6">
              <Input
                type="checkbox"
                class="h-4 w-4 cursor-pointer !border-none outline-0 focus:ring-0 accent-[#000]"
                :checked="isSelected(row.id)"
                @change="(evt: Event) => onRowCheckboxChange(row.id, evt)"
              />
            </td>

            <!-- cells -->
            <td
              v-for="col in props.columns"
              :key="col.key"
              class="p-3 text-start ps-12"
              :class="{ 'line-through text-gray-500': row.status && isInactiveStatus(row.status) }"
            >
              {{ row[col.key] }}
            </td>

            <td class="p-3 pe-8 flex gap-2" :class="isRtl ? 'justify-start' : 'justify-end'">
              <!-- Edit button for roles -->
              <UpdateRoleDialog v-if="roleTag === 'roles' && canEdit" :role="row" @role-updated="handleRoleUpdate">
                <Button
                  size="icon"
                  class="bg-[#171717] text-white size-7 !rounded-full !cursor-pointer"
                  variant="outline"
                  :disabled="isEditing"
                  @click="handleEditClick(row)"
                >
                  <LoadingSpinner v-if="isEditing" class="h-4 w-4" />
                  <Pencil v-else class="h-4 w-4" />
                </Button>
              </UpdateRoleDialog>

              <!-- Edit button for users -->
              <Button
                v-else-if="roleTag === 'users' && canEdit"
                size="icon"
                class="bg-[#171717] text-white size-7 !rounded-full !cursor-pointer"
                variant="outline"
                :disabled="isEditing"
                @click="handleEditClick(row)"
              >
                <LoadingSpinner v-if="isEditing" class="h-4 w-4" />
                <Pencil v-else class="h-4 w-4" />
              </Button>

              <div v-if="isDeleting && roleTag === 'roles'" class="flex items-center justify-center size-7">
                <LoadingSpinner class="h-4 w-4" />
              </div>
              <DeleteDialog v-else-if="canDelete" :row="row" :role-tag="roleTag" @delete="handleRoleDelete" @restore="$emit('restore', row)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- footer: results + pagination (hide pages when only 1 page) -->
    <div
      v-if="props.rows.length > 0"
      :class="['w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-8 border-t border-[#E5E5E5]', isRtl ? 'sm:flex-row-reverse' : '']"
    >
      <div :class="['flex flex-1 items-center justify-center gap-2', isRtl ? 'flex-row-reverse' : '']">
        <p :class="['text-sm whitespace-nowrap text-[#525252]', isRtl ? 'ms-auto' : 'me-auto']">
          {{ t("permissions.table.showing") }}
          {{ (currentPage - 1) * perPage + 1 }}
          {{ t("permissions.table.to") }}
          {{ Math.min(currentPage * perPage, totalItems) }}
          {{ t("permissions.table.of") }}
          {{ totalItems }} {{ t("permissions.table.results") }}
        </p>

        <div class="mx-auto flex items-center whitespace-nowrap" :class="isRtl ? 'flex-row-reverse' : ''">
          <span :class="['p-[5px] rounded-md border border-[#E5E5E5] text-[#737373]', isRtl ? 'border-l-0 rounded-l-none' : 'border-r-0 rounded-r-none']">
            {{ t("permissions.table.perPage") }}
          </span>
          <Select v-model="perPage" class="!cursor-pointer focus:shadow-none">
            <SelectTrigger class="w-[50px]">
              <span class="cursor-pointer">{{ perPage }}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="5">5</SelectItem>
              <SelectItem :value="10">10</SelectItem>
              <SelectItem :value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div v-if="totalPages > 1" class="w-fit">
        <Pagination v-slot="{ page }" :items-per-page="perPage" :total="totalItems" :default-page="currentPage">
          <PaginationContent v-slot="{ items }" :class="['flex border rounded-md overflow-hidden divide-x', isRtl ? 'flex-row-reverse' : '']">
            <PaginationPrevious
              :class="['cursor-pointer disabled:hidden px-3 py-1', isRtl ? 'border-l rounded-l-none' : 'border-r rounded-r-none']"
              @click="currentPage = Math.max(1, currentPage - 1)"
            />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
                class="cursor-pointer rounded-none text-gray-600 opacity-40 hover:bg-transparent aria-[current=page]:text-primary aria-[current=page]:font-bold aria-[current=page]:text-lg aria-[current=page]:opacity-100 transition duration-500 ease-in-out"
                @click="currentPage = item.value"
              >
                {{ item.value }}
              </PaginationItem>
            </template>
            <PaginationNext
              :class="['cursor-pointer disabled:hidden px-3 py-1', isRtl ? 'rounded-r-none' : 'rounded-l-none']"
              @click="currentPage = Math.min(Math.ceil((props.total || props.rows.length) / perPage), currentPage + 1)"
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>
