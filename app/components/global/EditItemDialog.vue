<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import DialogDescription from "../ui/dialog/DialogDescription.vue";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const props = defineProps<{
  dialogTitle: string;
  nameLabel: string;
  type: string;
  titleEn: string;
  titleAr: string;
  viewBy: string;
  roles?: Array<{ id: number; name: string }>;
  users?: Array<{ id: number; name: string; email?: string; role_id?: number }>;
  assignedRoles?: Array<{ id: number; name: string }>;
  assignedUsers?: Array<{ id: number; name: string; email?: string; role_id?: number }>;
}>();

// Use props directly
const availableRoles = computed(() => props.roles || []);
const availableUsers = computed(() => props.users || []);

const itemNameEn = ref(props.titleEn);
const itemNameAr = ref(props.titleAr);
const viewBy = ref(props.viewBy);

const selectedRoles = ref<string[]>([]);
const selectedUsers = ref<string[]>([]);

// Pre-populate selections with assigned roles/users
onMounted(() => {
  if (props.assignedRoles && props.assignedRoles.length > 0) {
    selectedRoles.value = props.assignedRoles.map((role) => role.name);
  }
  if (props.assignedUsers && props.assignedUsers.length > 0) {
    selectedUsers.value = props.assignedUsers.map((user) => user.name);
  }
});

const searchRoles = ref("");
const searchUsers = ref("");

const filteredRoles = computed(() => availableRoles.value.filter((role) => role.name.toLowerCase().includes(searchRoles.value.toLowerCase())));

const filteredUsers = computed(() => availableUsers.value.filter((user) => user.name.toLowerCase().includes(searchUsers.value.toLowerCase())));

const isOpen = ref(false);

// Validation errors
const errors = ref({
  nameEn: "",
  nameAr: "",
  viewBy: "",
  roles: "",
  users: "",
  general: "", // For API errors like duplicate name
});

// Reset form to original values
const resetForm = () => {
  itemNameEn.value = props.titleEn;
  itemNameAr.value = props.titleAr;
  viewBy.value = props.viewBy;

  // Reset to originally assigned roles/users
  selectedRoles.value = props.assignedRoles?.map((role) => role.name) || [];
  selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];

  searchRoles.value = "";
  searchUsers.value = "";
  errors.value = {
    nameEn: "",
    nameAr: "",
    viewBy: "",
    roles: "",
    users: "",
    general: "",
  };
};

// Validate form
const validateForm = () => {
  const newErrors = {
    nameEn: "",
    nameAr: "",
    viewBy: "",
    roles: "",
    users: "",
    general: "",
  };

  // Validate English name
  if (!itemNameEn.value.trim()) {
    newErrors.nameEn = t("dialog.validation.nameEnRequired", { label: props.nameLabel });
  }

  // Validate Arabic name
  if (!itemNameAr.value.trim()) {
    newErrors.nameAr = t("dialog.validation.nameArRequired", { label: props.nameLabel });
  }
  // Removed validation for viewBy/roles/users per requirements

  errors.value = newErrors;
  return !Object.values(newErrors).some((error) => error !== "");
};

watch(isOpen, (open) => {
  if (open) {
    // Populate selections when opening - this will show the currently assigned roles/users
    selectedRoles.value = props.assignedRoles?.map((role) => role.name) || [];
    selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];
  } else {
    resetForm(); // Reset when closing
  }
});

// Keep selected admins in sync with selected roles when view mode is "role"
watch(
  () => ({
    roles: [...selectedRoles.value],
    mode: viewBy.value,
  }),
  ({ roles, mode }) => {
    if (!availableUsers.value || availableUsers.value.length === 0) {
      return;
    }

    if (mode !== "role") {
      selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];
      return;
    }

    const selectedRoleIds = roles.map((roleName) => availableRoles.value.find((r) => r.name === roleName)?.id).filter((id): id is number => id !== undefined);

    const matchingAdmins = availableUsers.value.filter((user) => typeof user.role_id === "number" && selectedRoleIds.includes(user.role_id)).map((admin) => admin.name);

    selectedUsers.value = matchingAdmins;
  },
  { deep: true }
);

// Clear opposite selection when switching tabs
// watch(viewBy, (newViewBy) => {
//   if (newViewBy === "role") {
//     selectedUsers.value = [];
//   } else if (newViewBy === "users") {
//     selectedRoles.value = [];
//   }
// });

const emit = defineEmits<{
  (
    e: "on-edit",
    payload: {
      type: string;
      titleEn: string;
      titleAr: string;
      url: string;
      viewBy: string;
      roles: string[];
      users: string[];
    },
    onSuccess: () => void,
    onError: (error: string) => void
  ): void;
}>();

const saveItem = () => {
  if (!validateForm()) {
    return;
  }

  // Clear previous general errors
  errors.value.general = "";

  // Define callbacks for success/error
  const onSuccess = () => {
    isOpen.value = false;
  };

  const onError = (error: string) => {
    errors.value.general = error;
    // Keep dialog open so user can fix the issue
  };

  // Conditionally emit roles/users based on active viewBy tab
  const payload = {
    type: props.type,
    titleEn: itemNameEn.value,
    titleAr: itemNameAr.value,
    url: "/" + itemNameEn.value.toLowerCase().replace(/\s+/g, "-"),
    viewBy: viewBy.value,
    roles: viewBy.value === "role" ? selectedRoles.value : [],
    users: viewBy.value === "users" ? selectedUsers.value : [],
  };

  emit("on-edit", payload, onSuccess, onError);
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>

    <DialogContent>
      <DialogHeader>
        <DialogTitle class="text-start px-5 text-base sm:text-xl font-bold text-[#171717] mb-4">
          {{ props.dialogTitle }}
        </DialogTitle>
        <DialogDescription />
        <hr class="bg-gray-200 mt-3 w-full h-[0.5px]" />
      </DialogHeader>

      <div class="px-5 flex flex-col gap-7">
        <div v-if="errors.general" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-600 text-sm">{{ errors.general }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="nameEn" class="!text-[#171717] !mb-3">
              {{ props.nameLabel }} ({{ t("dialog.labels.english") }}) <span class="text-red-500">{{ t("dialog.labels.required") }}</span>
            </Label>
            <Input id="nameEn" v-model="itemNameEn" type="text" :class="{ 'border-red-500': errors.nameEn }" />
            <p v-if="errors.nameEn" class="text-red-500 text-sm mt-1">{{ errors.nameEn }}</p>
          </div>
          <div>
            <Label for="nameAr" class="!text-[#171717] !mb-3">
              {{ props.nameLabel }} ({{ t("dialog.labels.arabic") }}) <span class="text-red-500">{{ t("dialog.labels.required") }}</span>
            </Label>
            <Input id="nameAr" v-model="itemNameAr" type="text" dir="rtl" class="text-right" :class="{ 'border-red-500': errors.nameAr }" />
            <p v-if="errors.nameAr" class="text-red-500 text-sm mt-1">{{ errors.nameAr }}</p>
          </div>
        </div>

        <div>
          <Label class="!text-[#171717] !mb-3"> {{ t("dialog.labels.viewPermissions") }}</Label>
          <RadioGroup v-model="viewBy" :class="['flex gap-4', isRtl ? 'flex-row-reverse' : '']">
            <div
              :class="[
                'flex items-center w-[48%] border rounded-md p-2 cursor-pointer',
                viewBy === 'role' ? 'border-primary' : 'border-gray-200',
                isRtl ? 'flex-row-reverse' : '',
              ]"
              @click="viewBy = 'role'"
            >
              <Label for="role" :class="['font-normal cursor-pointer flex items-center gap-2', isRtl ? 'flex-row-reverse' : '']">
                <RadioGroupItem id="role" value="role" /> {{ t("dialog.labels.byRole") }}
              </Label>
            </div>
            <div
              :class="[
                'flex items-center w-[48%] border rounded-md p-2 cursor-pointer',
                viewBy === 'users' ? 'border-primary' : 'border-gray-200',
                isRtl ? 'flex-row-reverse' : '',
              ]"
              @click="viewBy = 'users'"
            >
              <Label for="users" :class="['font-normal cursor-pointer flex items-center gap-2', isRtl ? 'flex-row-reverse' : '']">
                <RadioGroupItem id="users" value="users" /> {{ t("dialog.labels.byUsers") }}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div v-if="viewBy === 'role'" class="flex flex-col gap-2">
          <div class="border rounded-md p-2 flex flex-col gap-2">
            <Input v-model="searchRoles" :placeholder="t('dialog.labels.searchRoles')" />
            <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
              <div v-if="availableRoles.length === 0" class="text-gray-500 text-sm py-2 text-center">{{ t("dialog.labels.noRolesAvailable") }}</div>
              <label v-for="role in filteredRoles" v-else :key="role.id" class="flex items-center gap-2 cursor-pointer">
                <input v-model="selectedRoles" type="checkbox" :value="role.name" class="accent-primary" />
                <span>{{ role.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="viewBy === 'users'" class="flex flex-col gap-2">
          <div class="border rounded-md p-2 flex flex-col gap-2">
            <Input v-model="searchUsers" :placeholder="t('dialog.labels.searchUsers')" />
            <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
              <div v-if="availableUsers.length === 0" class="text-gray-500 text-sm py-2 text-center">{{ t("dialog.labels.noUsersAvailable") }}</div>
              <label v-for="user in filteredUsers" v-else :key="user.id" class="flex items-center gap-2 cursor-pointer">
                <input v-model="selectedUsers" type="checkbox" :value="user.name" class="accent-primary" />
                <span>{{ user.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <Button class="bg-white border w-[48%] text-[#1E1E1E] hover:bg-gray-100 hover:text-[#1E1E1E] hover:border-gray-300" @click="isOpen = false">
            {{ t("dialog.buttons.cancel") }}
          </Button>

          <Button class="bg-primary text-white w-[48%]" @click="saveItem"> {{ t("dialog.buttons.saveChanges") }} </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
