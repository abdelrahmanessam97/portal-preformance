<template>
  <Dialog :open="isOpen" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle class="mt-4 text-start text-lg font-bold text-black">{{
          t("fileDialogs.accessibility.title")
        }}</DialogTitle>
        <DialogClose
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogHeader>

      <div>
        <Label class="!text-[#171717] !mb-3">
          {{ t("fileDialogs.accessibility.selectWhoView") }}
        </Label>
        <RadioGroup
          v-model="localViewBy"
          :class="['flex gap-4', isRtl ? 'flex-row-reverse' : '']"
        >
          <div
            :class="[
              'flex items-center w-[48%] border rounded-md p-2 cursor-pointer',
              localViewBy === 'role' ? 'border-primary' : 'border-gray-200',
              isRtl ? 'flex-row-reverse' : '',
            ]"
            @click="localViewBy = 'role'"
          >
            <Label
              for="role"
              :class="[
                'font-normal cursor-pointer flex items-center gap-2',
                isRtl ? 'flex-row-reverse' : '',
              ]"
            >
              <RadioGroupItem id="role" value="role" />
              {{ t("fileDialogs.common.byRole") }}
            </Label>
          </div>
          <div
            :class="[
              'flex items-center w-[48%] border rounded-md p-2 cursor-pointer',
              localViewBy === 'users' ? 'border-primary' : 'border-gray-200',
              isRtl ? 'flex-row-reverse' : '',
            ]"
            @click="localViewBy = 'users'"
          >
            <Label
              for="users"
              :class="[
                'font-normal cursor-pointer flex items-center gap-2',
                isRtl ? 'flex-row-reverse' : '',
              ]"
            >
              <RadioGroupItem id="users" value="users" />
              {{ t("fileDialogs.common.byUsers") }}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div v-if="localViewBy === 'role'" class="flex flex-col gap-2">
        <div class="border rounded-md p-2 flex flex-col gap-2">
          <Input
            v-model="searchRoles"
            :placeholder="t('fileDialogs.common.searchRoles')"
          />
          <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
            <div
              v-if="availableRoles.length === 0"
              class="text-gray-500 text-sm py-2 text-center"
            >
              {{ t("fileDialogs.common.noRolesAvailable") }}
            </div>
            <label
              v-for="role in filteredRoles"
              v-else
              :key="role.id"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                v-model="selectedRoles"
                type="checkbox"
                :value="role.name"
                class="accent-primary"
              />
              <span>{{ role.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <div v-if="localViewBy === 'users'" class="flex flex-col gap-2">
        <div class="border rounded-md p-2 flex flex-col gap-2">
          <Input
            v-model="searchUsers"
            :placeholder="t('fileDialogs.common.searchUsers')"
          />
          <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
            <div
              v-if="availableUsers.length === 0"
              class="text-gray-500 text-sm py-2 text-center"
            >
              {{ t("fileDialogs.common.noUsersAvailable") }}
            </div>
            <label
              v-for="user in filteredUsers"
              v-else
              :key="user.id"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                v-model="selectedUsers"
                type="checkbox"
                :value="user.name"
                class="accent-primary"
              />
              <span>{{ user.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button variant="outline" @click="$emit('close')">
          {{ t("fileDialogs.common.cancel") }}
        </Button>
        <Button @click="saveAccessibility">
          {{ t("fileDialogs.common.save") }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

interface Props {
  isOpen: boolean;
  roles?: Array<{ id: number; name: string }>;
  users?: Array<{ id: number; name: string; email?: string; role_id?: number }>;
  viewBy?: "role" | "users";
  assignedRoles?: Array<{ id: number; name: string }>;
  assignedUsers?: Array<{ id: number; name: string; role_id?: number }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  "save-accessibility": [
    data: { viewBy: "role" | "users"; roles: string[]; users: string[] }
  ];
}>();

// Available roles and users
const availableRoles = computed(() => props.roles || []);
const availableUsers = computed(() => props.users || []);

// Internal state
const localViewBy = ref<"role" | "users">("role");
const selectedRoles = ref<string[]>([]);
const selectedUsers = ref<string[]>([]);
const searchRoles = ref("");
const searchUsers = ref("");

// Watch for dialog open to initialize with props
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      // Initialize viewBy from props
      if (props.viewBy) {
        localViewBy.value = props.viewBy;
      }

      // Populate assigned roles and users - always set (even if empty array)
      selectedRoles.value = props.assignedRoles?.map((role) => role.name) || [];
      selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];
    } else {
      // Reset when closing
      searchRoles.value = "";
      searchUsers.value = "";
    }
  },
  { immediate: false }
);

// Keep selected admins in sync with selected roles when view mode is "role"
watch(
  () => ({
    roles: [...selectedRoles.value],
    mode: localViewBy.value,
  }),
  ({ roles, mode }) => {
    if (!availableUsers.value || availableUsers.value.length === 0) {
      return;
    }

    if (mode !== "role") {
      selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];
      return;
    }

    const selectedRoleIds = roles
      .map(
        (roleName) => availableRoles.value.find((r) => r.name === roleName)?.id
      )
      .filter((id): id is number => id !== undefined);

    const matchingAdmins = availableUsers.value
      .filter(
        (user) =>
          typeof user.role_id === "number" &&
          selectedRoleIds.includes(user.role_id)
      )
      .map((admin) => admin.name);

    selectedUsers.value = matchingAdmins;
  },
  { deep: true }
);

const filteredRoles = computed(() =>
  availableRoles.value.filter((role) =>
    role.name.toLowerCase().includes(searchRoles.value.toLowerCase())
  )
);

const filteredUsers = computed(() =>
  availableUsers.value.filter((user) =>
    user.name.toLowerCase().includes(searchUsers.value.toLowerCase())
  )
);

const saveAccessibility = () => {
  // Conditionally emit roles/users based on active viewBy tab
  const payload = {
    viewBy: localViewBy.value,
    roles: localViewBy.value === "role" ? selectedRoles.value : [],
    users: localViewBy.value === "users" ? selectedUsers.value : [],
  };

  emit("save-accessibility", payload);
  emit("close");
};
</script>
