<!-- app/components/permissions/AssignRoleDialog.vue -->
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useFetchRoles } from "~/composables/roles/useFetchRoles";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const props = defineProps<{
  selectedUserIds?: string[];
}>();

const emit = defineEmits<{
  (e: "assigned", payload: { userIds: string[]; role_id: number; role_name: string }): void;
}>();

const selectedRoleId = ref<number | null>(null);
const isDialogOpen = ref(false);

// Fetch roles from API
const { data: rolesData } = useFetchRoles();
const roles = computed(() => rolesData.value?.data || []);
const canOpen = computed(() => !!props.selectedUserIds && props.selectedUserIds.length > 0);

// Reset selected role on open
watch(isDialogOpen, (open) => {
  if (open) selectedRoleId.value = null;
});

const handleAssignRole = () => {
  if (!props.selectedUserIds || props.selectedUserIds.length === 0) {
    return;
  }

  if (!selectedRoleId.value) {
    return;
  }

  // Find role name for convenience
  const role = roles.value.find((r: { id: number; name: string }) => r.id === selectedRoleId.value);
  const role_name = role?.name || "";

  // Emit the role assignment event
  emit("assigned", {
    userIds: props.selectedUserIds,
    role_id: selectedRoleId.value,
    role_name,
  });

  // Close the dialog
  isDialogOpen.value = false;
};
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger v-if="canOpen" as-child>
      <div :class="['flex items-center gap-2 px-2 py-1 text-[14px] cursor-pointer text-[#535353] font-semibold', isRtl ? 'flex-row-reverse' : '']">
        <ClipboardList :class="['text-[#535353] size-4', isRtl ? 'ms-2' : 'me-2']" />
        {{ t("permissions.assign.title") }}
      </div>
    </DialogTrigger>
    <template v-else>
      <div :class="['flex items-center gap-2 px-2 py-1 text-[14px] text-[#535353] font-semibold opacity-50 cursor-not-allowed', isRtl ? 'flex-row-reverse' : '']" @click.stop.prevent>
        <ClipboardList :class="['text-[#535353] size-4', isRtl ? 'ms-2' : 'me-2']" />
        {{ t("permissions.assign.title") }}
      </div>
    </template>

    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-[#171717] px-5 font-semibold">{{ t("permissions.assign.title") }}</DialogTitle>
        <hr class="bg-gray-200 mt-3 w-full h-[0.5px]" />
        <DialogDescription class="px-5 mt-3 text-[#171717]">
          {{ t("permissions.assign.description", { count: props.selectedUserIds?.length || 0 }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="px-5 pb-4">
        <div class="space-y-2">
          <Label class="text-sm font-medium mb-2">{{ t("permissions.assign.role") }}</Label>
          <Select v-model="selectedRoleId">
            <SelectTrigger class="w-full rounded-sm">
              <SelectValue :placeholder="t('permissions.assign.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter :class="['flex gap-2 px-4 pb-4', isRtl ? 'flex-row-reverse' : '']">
        <DialogClose as-child>
          <Button variant="outline" class="flex-1 border-[#ACACAC]">{{ t("permissions.assign.cancel") }}</Button>
        </DialogClose>
        <Button
          class="flex-1 bg-primary hover:bg-primary/90"
          :disabled="!props.selectedUserIds || props.selectedUserIds.length === 0 || !selectedRoleId"
          @click="handleAssignRole"
        >
          {{ t("permissions.assign.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
