<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Trash, Undo2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import AssignRoleDialog from "~/components/permissions/AssignRoleDialog.vue";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { useChangeStatus } from "~/composables/settings/useChangeStatus";
import type { ApiError } from "~~/types/role";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const props = defineProps<{
  selectedUserIds: string[];
  selectedUsersAreInactive: boolean;
}>();

const emit = defineEmits<{
  (e: "assignRole", payload: { userIds: string[]; role_id: number }): void;
  (e: "refresh"): void;
}>();

const handleAssignRole = (payload: { userIds: string[]; role_id: number }) => emit("assignRole", payload);

const performBulkChange = async (status: 1 | 2) => {
  if (!props.selectedUserIds.length) return;

  try {
    await Promise.all(
      props.selectedUserIds.map((id) =>
        useChangeStatus({
          model_name: "Admin",
          model_id: parseInt(id.replace("#", "")),
          status,
        })
      )
    );
    emit("refresh");
    toast.success(status === 1 ? t("permissions.bulk.toast.restoredSuccess") : t("permissions.bulk.toast.disabledSuccess"));
  } catch (error: unknown) {
    const apiError = error as ApiError;
    toast.error(apiError?.message || t("permissions.bulk.toast.actionFailed"), { description: apiError?.data as string });
  }
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button
        variant="default"
        :class="['!bg-white text-black hover:!bg-white/50 font-semibold !px-4 cursor-pointer flex items-center gap-2', isRtl ? 'flex-row-reverse' : '']"
      >
        <EllipsisVertical :class="isRtl ? 'order-2' : 'order-1'" />
        <span class="hidden md:block"> {{ t("permissions.bulk.title") }}</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent>
      <AssignRoleDialog :selected-user-ids="props.selectedUserIds" @assigned="handleAssignRole" />
      <DropdownMenuSeparator />

      <DropdownMenuItem
        v-if="props.selectedUsersAreInactive"
        :class="['cursor-pointer text-[#059669] font-semibold hover:!bg-transparent hover:!text-[#059669]', isRtl ? 'flex-row-reverse' : '']"
        :disabled="props.selectedUserIds.length === 0"
        @click="performBulkChange(1)"
      >
        <Undo2 :class="['text-[#059669] size-4', isRtl ? 'ms-2' : 'me-2']" />
        {{ t("permissions.bulk.restore") }}
      </DropdownMenuItem>

      <DropdownMenuItem
        v-else
        :class="['!cursor-pointer text-[#CE0505] font-semibold hover:!bg-transparent hover:!text-[#CE0505]', isRtl ? 'flex-row-reverse' : '']"
        :disabled="props.selectedUserIds.length === 0"
        @click="performBulkChange(2)"
      >
        <Trash :class="['text-[#CE0505] fill-[#CE0505] size-4', isRtl ? 'ms-2' : 'me-2']" />
        {{ t("permissions.bulk.disable") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
