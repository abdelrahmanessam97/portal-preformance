<!-- app/components/permissions/DeleteDialog.vue -->
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Minus, Trash2, Undo2 } from "lucide-vue-next";
import { isInactiveStatus } from "~/composables/settings/useChangeStatus";

const { t } = useI18n();

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: "Active" | "Inactive" | "نشط" | "غير نشط";
}

interface Role {
  id: string;
  name: string;
  deleted?: boolean;
}

type TableRow = User | Role;

const props = defineProps<{
  row: TableRow;
  roleTag: "users" | "roles";
}>();

const emit = defineEmits<{
  (e: "delete" | "restore", row: TableRow): void;
}>();

const isInactiveUser = (row: TableRow): boolean => {
  const status = (row as User).status;
  return !!status && isInactiveStatus(status);
};
</script>

<template>
  <!-- Users = soft deactivate/activate with confirm -->
  <template v-if="roleTag === 'users'">
    <Dialog>
      <DialogTrigger as-child>
        <Button
          size="icon"
          :variant="isInactiveUser(props.row) ? 'outline' : 'destructive'"
          class="size-7 !rounded-full !cursor-pointer"
          :class="isInactiveUser(props.row) ? 'bg-gray-300 text-black' : 'bg-[#CE0505] text-white hover:opacity-80'"
        >
          <component :is="isInactiveUser(props.row) ? Undo2 : Minus" class="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent class="w-[525px]">
        <DialogHeader>
          <DialogTitle class="text-[#000000] text-center mt-6">
            {{ isInactiveUser(props.row) ? t("permissions.delete.activateUser") : t("permissions.delete.deactivateUser") }}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div class="flex justify-center w-3/4 mx-auto gap-2 mt-4">
          <DialogTrigger as-child>
            <Button variant="outline" class="w-1/2 cursor-pointer">{{ t("permissions.delete.cancel") }}</Button>
          </DialogTrigger>
          <DialogTrigger as-child>
            <Button class="w-1/2 cursor-pointer" @click="isInactiveUser(props.row) ? emit('restore', props.row) : emit('delete', props.row)">
              {{ t("permissions.delete.confirm") }}
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  </template>

  <!-- Roles = hard delete -->
  <template v-else>
    <Dialog>
      <DialogTrigger as-child>
        <Button size="icon" variant="destructive" class="bg-[#CE0505] text-white size-7 !rounded-full !cursor-pointer hover:opacity-80">
          <Trash2 class="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent class="w-[525px]">
        <DialogHeader>
          <DialogTitle class="text-[#000000] text-center mt-6">{{ t("permissions.delete.deleteRole") }}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div class="flex justify-center w-3/4 mx-auto gap-2 mt-4">
          <DialogTrigger as-child>
            <Button variant="outline" class="w-1/2 cursor-pointer">{{ t("permissions.delete.cancel") }}</Button>
          </DialogTrigger>
          <DialogTrigger as-child>
            <Button variant="default" class="w-1/2 cursor-pointer" @click="emit('delete', props.row)">{{ t("permissions.delete.confirm") }}</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  </template>
</template>
