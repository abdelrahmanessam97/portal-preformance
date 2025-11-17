<!-- /app/components/home/EditFileDialog.vue -->
<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpdateFile } from "@/composables/files/useUpdateFile";
import { Loader2 } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type { ZodError } from "zod";
import { z } from "zod";
import type { FileResponse } from "../../../types/file";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const props = defineProps<{
  isOpen: boolean;
  fileItem: FileResponse | null;
  roles?: Array<{ id: number; name: string }>;
  users?: Array<{ id: number; name: string; email?: string; role_id?: number }>;
  viewBy?: "" | "role" | "users";
  assignedRoles?: Array<{ id: number; name: string }>;
  assignedUsers?: Array<{ id: number; name: string; role_id?: number }>;
}>();

const emit = defineEmits<{
  (e: "close" | "file-updated"): void;
  (e: "update-file", data: { id: number; payload: { en: { title: string; description: string }; ar: { title: string; description: string }; parent_id: number } }): void;
}>();

const fileSchema = z.object({
  titleEn: z.string().nonempty("English title is required"),
  titleAr: z.string().nonempty("Arabic title is required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

const editableFile = ref<FileResponse | null>(null);
const errors = ref<Record<string, string>>({});
const submitting = ref(false);

// Inline document upload rows (max 6)
type ViewBy = "" | "role" | "users";
interface DocRow {
  id: string;
  nameEN: string;
  nameAR: string;
  file: File | null;
  locked: boolean;
  viewBy: ViewBy;
  selectedRoles: string[];
  selectedUsers: string[];
  existingAttachmentId?: number; // Track existing attachment ID
}

// Start with no rows; user adds explicitly
const rows = ref<DocRow[]>([]);

// File-level access control (like EditItemDialog)
const viewBy = ref<"" | "role" | "users">(props.viewBy || "");
const selectedRoles = ref<string[]>([]);
const selectedUsers = ref<string[]>([]);

// Use props directly
const availableRoles = computed(() => props.roles || []);
const availableUsers = computed(() => props.users || []);

const searchRoles = ref("");
const searchUsers = ref("");
const filteredRoles = computed(() => availableRoles.value.filter((r) => r.name.toLowerCase().includes(searchRoles.value.toLowerCase())));
const filteredUsers = computed(() => availableUsers.value.filter((u) => u.name.toLowerCase().includes(searchUsers.value.toLowerCase())));

watch(
  () => props.fileItem,
  (item) => {
    if (item) {
      editableFile.value = {
        ...item,
        description_en: item.description_en || "",
        description_ar: item.description_ar || "",
      };
      errors.value = {};

      // Populate existing attachments as document rows (without pre-populating roles/users yet)
      if (item.attachments && item.attachments.length > 0) {
        rows.value = item.attachments.map((attachment) => ({
          id: crypto.randomUUID(),
          nameEN: attachment.title || "",
          nameAR: attachment.title || "", // Use same title for both if no separate AR title
          file: null, // No file object for existing attachments
          locked: false,
          viewBy: "" as ViewBy,
          selectedRoles: [],
          selectedUsers: [],
          existingAttachmentId: attachment.id, // Track existing attachment ID
        }));
      } else {
        // Reset to empty row if no attachments
        rows.value = [
          {
            id: crypto.randomUUID(),
            nameEN: "",
            nameAR: "",
            file: null,
            locked: false,
            viewBy: "" as ViewBy,
            selectedRoles: [],
            selectedUsers: [],
          },
        ];
      }
    } else {
      editableFile.value = null;
      errors.value = {};
      rows.value = [
        {
          id: crypto.randomUUID(),
          nameEN: "",
          nameAR: "",
          file: null,
          locked: false,
          viewBy: "" as ViewBy,
          selectedRoles: [],
          selectedUsers: [],
        },
      ];
    }
  },
  { immediate: true }
);

// Reset form to original values (like EditItemDialog)
const resetForm = () => {
  if (props.fileItem) {
    editableFile.value = {
      ...props.fileItem,
      description_en: props.fileItem.description_en || "",
      description_ar: props.fileItem.description_ar || "",
    };
  }

  // Reset viewBy from props
  viewBy.value = (props.viewBy as "" | "role" | "users") || "";

  // Reset to originally assigned roles/users
  selectedRoles.value = props.assignedRoles?.map((role) => role.name) || [];
  selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];

  searchRoles.value = "";
  searchUsers.value = "";
  errors.value = {};
};

// Watch dialog open state to pre-populate assigned roles/users (like EditItemDialog)
watch(
  () => props.isOpen,
  (open) => {
    if (open && props.fileItem) {
      // Initialize viewBy from props
      if (props.viewBy) {
        viewBy.value = props.viewBy as "role" | "users";
      }

      // Populate file-level access control - this will show the currently assigned roles/users
      selectedRoles.value = props.assignedRoles?.map((role) => role.name) || [];
      selectedUsers.value = props.assignedUsers?.map((user) => user.name) || [];

      // Also update rows if they exist
      if (rows.value.length > 0) {
        rows.value.forEach((row) => {
          row.viewBy = (props.viewBy as ViewBy) || ((selectedRoles.value.length > 0 ? "role" : "users") as ViewBy);
          row.selectedRoles = [...selectedRoles.value];
          row.selectedUsers = [...selectedUsers.value];
        });
      }
    } else {
      resetForm(); // Reset when closing
    }
  },
  { immediate: false }
);

// Keep selected admins in sync with selected roles when view mode is "role" (like EditItemDialog)
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

const updateFile = async () => {
  if (submitting.value || !editableFile.value) return;

  const result = fileSchema.safeParse({
    titleEn: editableFile.value.title_en.trim(),
    titleAr: editableFile.value.title_ar.trim(),
    descriptionEn: editableFile.value.description_en?.trim(),
    descriptionAr: editableFile.value.description_ar?.trim(),
  });

  if (!result.success) {
    const zodError: ZodError = result.error;
    errors.value = {};
    zodError.issues.forEach((issue) => {
      errors.value[issue.path[0] as string] = issue.message;
    });
    return;
  }

  submitting.value = true;
  try {
    // Conditionally convert selected roles and users to IDs based on active viewBy tab
    let roleIds: number[] | undefined = undefined;
    let adminIds: number[] | undefined = undefined;

    if (viewBy.value === "role") {
      // Only send role_ids when on role tab
      if (selectedRoles.value.length > 0) {
        roleIds = selectedRoles.value.map((roleName) => availableRoles.value.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];
      }
      adminIds = undefined;
    } else if (viewBy.value === "users") {
      // Only send admin_ids when on users tab
      if (selectedUsers.value.length > 0) {
        adminIds = selectedUsers.value.map((userName) => availableUsers.value.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];
      }
      roleIds = undefined;
    }

    const payload = {
      en: {
        title: editableFile.value.title_en.trim(),
        description: editableFile.value.description_en?.trim() ?? "",
      },
      ar: {
        title: editableFile.value.title_ar.trim(),
        description: editableFile.value.description_ar?.trim() ?? "",
      },
      parent_id: editableFile.value.folder_id || editableFile.value.category_id || 0,
      role_ids: roleIds,
      admin_ids: adminIds,
    };

    // Call the update API directly
    const result = await useUpdateFile(editableFile.value.id, payload);

    if (result.error || result.status >= 400) {
      toast.error(result.message || t("fileDialogs.editFile.updateFailed"));
      return;
    }

    toast.success(t("fileDialogs.editFile.updateSuccess"));
    resetForm(); // Reset form after successful update
    emit("file-updated");
    emit("close");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    errors.value["general"] = `Failed to update file: ${errorMessage}`;
    toast.error(t("fileDialogs.editFile.updateFailed"), { description: errors.value["general"] });
  } finally {
    submitting.value = false;
  }
};

const closeDialog = () => {
  if (submitting.value) return;
  resetForm(); // Reset form when closing (like EditItemDialog)
  emit("close");
};
</script>

<template>
  <!-- Button is always visible -->
  <slot />

  <!-- Dialog only shows when open and file data is available -->
  <div v-if="isOpen && editableFile" class="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50 p-4" @click.self="closeDialog">
    <div class="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xl shadow-md h-auto max-h-[90vh] overflow-y-auto">
      <h2 class="text-base sm:text-xl font-bold text-[#171717] mb-4">{{ t("fileDialogs.editFile.title") }}</h2>
      <form class="space-y-3 sm:space-y-4" @submit.prevent="updateFile">
        <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
          <div class="w-full sm:w-1/2">
            <label for="titleEn" class="block text-xs sm:text-sm font-medium text-gray-500">
              {{ t("fileDialogs.editFile.nameEnglish") }} <span class="text-red-500">{{ t("fileDialogs.common.required") }}</span>
            </label>
            <input
              id="titleEn"
              v-model="editableFile.title_en"
              type="text"
              class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              :disabled="submitting"
            />
            <p v-if="errors.titleEn" class="text-xs text-red-500 mt-1">
              {{ errors.titleEn }}
            </p>
          </div>
          <div class="w-full sm:w-1/2">
            <label for="titleAr" class="block text-xs sm:text-sm font-medium text-gray-500">
              {{ t("fileDialogs.editFile.nameArabic") }} <span class="text-red-500">{{ t("fileDialogs.common.required") }}</span>
            </label>
            <input
              id="titleAr"
              v-model="editableFile.title_ar"
              type="text"
              dir="rtl"
              class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              :disabled="submitting"
            />
            <p v-if="errors.titleAr" class="text-xs text-red-500 mt-1">
              {{ errors.titleAr }}
            </p>
          </div>
        </div>

        <div>
          <label for="descriptionEn" class="block text-xs sm:text-sm font-medium text-gray-500"> {{ t("fileDialogs.editFile.descriptionEnglish") }} </label>
          <textarea
            id="descriptionEn"
            v-model="editableFile.description_en"
            class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            rows="3"
            :disabled="submitting"
          />
          <p v-if="errors.descriptionEn" class="text-xs text-red-500 mt-1">
            {{ errors.descriptionEn }}
          </p>
        </div>
        <div>
          <label for="descriptionAr" class="block text-xs sm:text-sm font-medium text-gray-500"> {{ t("fileDialogs.editFile.descriptionArabic") }} </label>
          <textarea
            id="descriptionAr"
            v-model="editableFile.description_ar"
            dir="rtl"
            class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            rows="3"
            :disabled="submitting"
          />
          <p v-if="errors.descriptionAr" class="text-xs text-red-500 mt-1">
            {{ errors.descriptionAr }}
          </p>
        </div>

        <div>
          <Label class="!text-[#171717] !mb-3"> {{ t("fileDialogs.editFile.selectWhoView") }} </Label>
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
                <RadioGroupItem id="role" value="role" /> {{ t("fileDialogs.common.byRole") }}
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
                <RadioGroupItem id="users" value="users" /> {{ t("fileDialogs.common.byUsers") }}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div v-if="viewBy === 'role'" class="flex flex-col gap-2">
          <div class="border rounded-md p-2 flex flex-col gap-2">
            <Input v-model="searchRoles" :placeholder="t('fileDialogs.common.searchRoles')" />
            <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
              <div v-if="availableRoles.length === 0" class="text-gray-500 text-sm py-2 text-center">{{ t("fileDialogs.common.noRolesAvailable") }}</div>
              <label v-for="role in filteredRoles" v-else :key="role.id" class="flex items-center gap-2 cursor-pointer">
                <input v-model="selectedRoles" type="checkbox" :value="role.name" class="accent-primary" />
                <span>{{ role.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="viewBy === 'users'" class="flex flex-col gap-2">
          <div class="border rounded-md p-2 flex flex-col gap-2">
            <Input v-model="searchUsers" :placeholder="t('fileDialogs.common.searchUsers')" />
            <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
              <div v-if="availableUsers.length === 0" class="text-gray-500 text-sm py-2 text-center">{{ t("fileDialogs.common.noUsersAvailable") }}</div>
              <label v-for="user in filteredUsers" v-else :key="user.id" class="flex items-center gap-2 cursor-pointer">
                <input v-model="selectedUsers" type="checkbox" :value="user.name" class="accent-primary" />
                <span>{{ user.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <button type="button" class="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" :disabled="submitting" @click="closeDialog">
            {{ t("fileDialogs.common.cancel") }}
          </button>
          <button type="submit" class="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center justify-center" :disabled="submitting">
            <span v-if="!submitting">{{ t("fileDialogs.common.save") }}</span>
            <Loader2 v-else class="w-5 h-5 animate-spin" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
