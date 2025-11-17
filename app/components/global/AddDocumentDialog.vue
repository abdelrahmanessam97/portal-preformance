<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpload } from "@/composables/uploads/useUpload";
import { PlusCircle, UploadCloud, CircleX as XIcon } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import DialogDescription from "../ui/dialog/DialogDescription.vue";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const props = defineProps<{
  dialogTitle?: string;
  fileId: number;
  roles?: Array<{ id: number; name: string }>;
  users?: Array<{ id: number; name: string; email?: string; role_id?: number }>;
  file?: {
    title_en?: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    folder_id?: number;
    attachments?: Array<{ id: number; title: string }>;
  } | null;
}>();
const emit = defineEmits<{
  documentAdded: [attachmentIds?: number[], roleIds?: number[], adminIds?: number[]];
}>();

type ViewBy = "" | "role" | "users";
interface DocRow {
  id: string;
  name: string;
  file: File | null;
  locked: boolean;
  viewBy: ViewBy;
  selectedRoles: string[];
  selectedUsers: string[];
  uploading: boolean;
  uploadError: string | null;
}

const rows = ref<DocRow[]>([
  {
    id: crypto.randomUUID(),
    name: "",
    file: null,
    locked: false,
    viewBy: "",
    selectedRoles: [],
    selectedUsers: [],
    uploading: false,
    uploadError: null,
  },
]);

const isOpen = ref(false);
const MAX_DOCS = 6;

// Use props directly
const availableRoles = computed(() => props.roles || []);
const availableUsers = computed(() => props.users || []);

const searchRoles = ref("");
const searchUsers = ref("");
const filteredRoles = computed(() => availableRoles.value.filter((r) => r.name.toLowerCase().includes(searchRoles.value.toLowerCase())));
const filteredUsers = computed(() => availableUsers.value.filter((u) => u.name.toLowerCase().includes(searchUsers.value.toLowerCase())));

const pickers = ref<Record<string, HTMLInputElement | null>>({});

function triggerPicker(rowId: string) {
  pickers.value[rowId]?.click();
}

function onPicked(rowId: string, e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  const row = rows.value.find((r) => r.id === rowId);
  if (row) row.file = file;
  input.value = "";
}

function addRow() {
  if (rows.value.length >= MAX_DOCS) return;

  // Check if there are any permissions to inherit
  const hasRoles = props.roles && props.roles.length > 0;
  const hasUsers = props.users && props.users.length > 0;

  // Determine which mode to use (but don't pre-select roles/users)
  let inheritedViewBy: ViewBy = "";

  if (hasRoles) {
    inheritedViewBy = "role";
  } else if (hasUsers) {
    inheritedViewBy = "users";
  }

  const newRow = {
    id: crypto.randomUUID(),
    name: "",
    file: null,
    locked: false, // Start with checkbox unchecked - user must enable it
    viewBy: inheritedViewBy,
    selectedRoles: [], // Start with roles unselected - user must select them
    selectedUsers: [], // Start with users unselected - user must select them
    uploading: false,
    uploadError: null,
  };
  rows.value.push(newRow);
  // Initialize previous state for new row
}

function removeRow(id: string) {
  rows.value = rows.value.filter((r) => r.id !== id);
  if (rows.value.length === 0) addRow();
}

const canSave = computed(() => rows.value.some((r) => r.file && r.name.trim()));

// Watch for dialog open/close and inherit permissions
watch(isOpen, (open) => {
  if (open) {
    // When dialog opens, inherit permissions from the file for all existing rows
    const hasRoles = props.roles && props.roles.length > 0;
    const hasUsers = props.users && props.users.length > 0;

    // Determine which mode to use
    let inheritedViewBy: ViewBy = "";
    if (hasRoles) inheritedViewBy = "role";
    else if (hasUsers) inheritedViewBy = "users";

    // Apply inherited view mode to all existing rows (but keep checkbox and selections unchecked)
    rows.value.forEach((row) => {
      if (inheritedViewBy === "role" && props.roles) {
        row.viewBy = "role";
        row.selectedRoles = []; // Start with roles unselected - user must select them
        row.locked = false; // Start with checkbox unchecked - user must enable it
      } else if (inheritedViewBy === "users" && props.users) {
        row.viewBy = "users";
        row.selectedUsers = []; // Start with users unselected - user must select them
        row.locked = false; // Start with checkbox unchecked - user must enable it
      }
    });
  }
});

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

// Keep selected admins in sync with selected roles when rows are locked and in "role" mode
watch(
  () =>
    rows.value.map((row) => ({
      id: row.id,
      roles: [...row.selectedRoles],
      viewBy: row.viewBy,
      locked: row.locked,
    })),
  (snapshot) => {
    if (!availableUsers.value || availableUsers.value.length === 0) return;

    snapshot.forEach(({ id, roles, viewBy, locked }) => {
      const row = rows.value.find((r) => r.id === id);
      if (!row || !locked || viewBy !== "role") return;

      const selectedRoleIds = roles
        .map((roleName) => availableRoles.value.find((r) => r.name === roleName)?.id)
        .filter((roleId): roleId is number => roleId !== undefined);

      const matchingAdmins = availableUsers.value.filter((user) => typeof user.role_id === "number" && selectedRoleIds.includes(user.role_id)).map((admin) => admin.name);

      if (!arraysEqual(row.selectedUsers, matchingAdmins)) {
        row.selectedUsers = matchingAdmins;
      }
    });
  },
  { deep: true }
);

async function save() {
  const validRows = rows.value.filter((r) => r.file && r.name.trim());

  if (validRows.length === 0) {
    toast.error(t("fileDialogs.addDocument.uploadError"));
    return;
  }

  // Check for duplicate attachment names
  const existingAttachmentTitles = (props.file?.attachments || []).map((att) => att.title.toLowerCase().trim());
  const newAttachmentNames = validRows.map((r) => r.name.trim().toLowerCase());

  // Check if any new name matches existing attachment titles
  const duplicateNames = newAttachmentNames.filter((name) => existingAttachmentTitles.includes(name));

  if (duplicateNames.length > 0) {
    toast.error("Attachment names must be unique within this file.");
    return;
  }

  // Check for duplicates within the new attachments being added
  const seenNames = new Set<string>();
  const duplicatesInNew = newAttachmentNames.filter((name) => {
    if (seenNames.has(name)) {
      return true;
    }
    seenNames.add(name);
    return false;
  });

  if (duplicatesInNew.length > 0) {
    toast.error("Attachment names must be unique within this file.");
    return;
  }

  const uploadedAttachmentIds: number[] = [];
  const allRoleIds = new Set<number>();
  const allAdminIds = new Set<number>();

  // Upload each document individually with loader
  for (const row of validRows) {
    if (!row.file) continue;

    // Set uploading state
    row.uploading = true;
    row.uploadError = null;

    try {
      // Use document name (required)
      const documentTitle = row.name?.trim() || row.file.name || "Untitled Document";

      // Convert role names to IDs for this specific row
      let roleIds: number[] | undefined = undefined;
      let adminIds: number[] | undefined = undefined;

      if (row.locked && row.viewBy === "role" && row.selectedRoles.length > 0) {
        roleIds = row.selectedRoles.map((roleName) => availableRoles.value.find((r) => r.name === roleName)?.id).filter((id) => id !== undefined) as number[];
        // Collect role IDs for emission
        roleIds.forEach((id) => allRoleIds.add(id));
      }

      if (row.locked && row.viewBy === "users" && row.selectedUsers.length > 0) {
        adminIds = row.selectedUsers.map((userName) => availableUsers.value.find((u) => u.name === userName)?.id).filter((id) => id !== undefined) as number[];
        // Collect admin IDs for emission
        adminIds.forEach((id) => allAdminIds.add(id));
      }

      // Detect file type (image or file) based on mime type or extension
      const detectedType = detectFileType(row.file);

      // Upload with role_ids and admin_ids, using detected type
      const uploadResult = await useUpload(row.file, documentTitle, detectedType, adminIds, roleIds);

      if (uploadResult.error || !uploadResult.data) {
        row.uploadError = uploadResult.error || t("fileDialogs.addDocument.failedToUpload");
        row.uploading = false;
        continue;
      }

      const attachmentId = uploadResult.data.data.id;
      uploadedAttachmentIds.push(attachmentId);
      row.uploading = false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      row.uploadError = errorMessage;
      row.uploading = false;
    }
  }

  // Check if any uploads failed
  const failedUploads = validRows.filter((r) => r.uploadError);
  if (failedUploads.length > 0) {
    toast.error(t("fileDialogs.addDocument.uploadFailed", { count: failedUploads.length }));
    return;
  }

  // Emit the uploaded attachment IDs along with the role_ids and admin_ids used during upload
  // The parent component will handle the file update with correct parent_id
  if (uploadedAttachmentIds.length > 0) {
    const roleIdsArray = allRoleIds.size > 0 ? Array.from(allRoleIds) : undefined;
    const adminIdsArray = allAdminIds.size > 0 ? Array.from(allAdminIds) : undefined;
    emit("documentAdded", uploadedAttachmentIds, roleIdsArray, adminIdsArray);
  }

  isOpen.value = false;

  // Reset rows for next use
  rows.value = [
    {
      id: crypto.randomUUID(),
      name: "",
      file: null,
      locked: false,
      viewBy: "",
      selectedRoles: [],
      selectedUsers: [],
      uploading: false,
      uploadError: null,
    },
  ];
}

function fileExt(f: File | null) {
  if (!f) return "";
  const t = f.name.split(".").pop() || "";
  return t.toUpperCase();
}

function detectFileType(file: File): "image" | "file" {
  // Check mime type first (more reliable)
  if (file.type) {
    if (file.type.startsWith("image/")) {
      return "image";
    }
  }

  // Fallback to extension detection
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"];

  if (imageExts.includes(ext)) {
    return "image";
  }

  // Default to "file" for documents (pdf, doc, xlsx, etc.)
  return "file";
}

function extBadgeClass(ext: string) {
  const e = ext.toLowerCase();
  if (e === "pdf") return "border-red-400 text-red-600";
  if (["xls", "xlsx", "csv", "ods"].includes(e)) return "border-green-400 text-green-600";
  if (["jpg", "jpeg", "png", "gif"].includes(e)) return "border-amber-400 text-amber-600";
  if (["ppt", "pptx", "odp"].includes(e)) return "border-purple-400 text-purple-600";
  if (["doc", "docx", "rtf", "txt"].includes(e)) return "border-blue-400 text-blue-600";
  return "border-gray-300 text-gray-600";
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger class="w-full flex items-center gap-2 p-2 border-l-2 cursor-pointer font-semibold border-l-transparent">
      <slot />
    </DialogTrigger>

    <DialogContent class="max-w-2xl w-[96vw] sm:w-[780px] max-h-[85vh] p-0 overflow-y-auto">
      <div class="flex flex-col h-full min-h-0">
        <DialogHeader class="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle class="text-start px-5 text-base sm:text-xl font-bold text-[#171717]">
            {{ t("fileDialogs.addDocument.title") }}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div class="px-5 pb-4 flex-1 min-h-0 overflow-y-auto space-y-5">
          <div v-for="r in rows" :key="r.id" class="relative rounded-xl border bg-white p-4 space-y-4">
            <div class="flex items-center justify-between">
              <Label class="text-base sm:text-xl font-bold text-[#171717] mb-4">{{ t("fileDialogs.addDocument.documents") }}</Label>
              <button
                class="text-red-500 hover:bg-red-50 rounded-full h-8 w-8 flex items-center justify-center"
                aria-label="Remove"
                title="Remove"
                @click="removeRow(r.id)"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Upload + name -->
            <div class="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-4">
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="w-full h-24 rounded-lg border border-dashed bg-white hover:bg-gray-50 transition flex items-center justify-center gap-2 text-gray-700"
                  @click="triggerPicker(r.id)"
                >
                  <UploadCloud class="h-5 w-5" />
                  <span class="text-sm text-left">
                    {{ r.file ? t("fileDialogs.addDocument.changeFile") : t("fileDialogs.addDocument.upload") }}
                  </span>
                </button>
                <input
                  :ref="el => (pickers[r.id] = el as HTMLInputElement)"
                  type="file"
                  accept=".doc,.docx,.pdf,.txt,.rtf,.xls,.xlsx,.csv,.ods,.ppt,.pptx,.odp,.png,.jpg,.jpeg,.gif"
                  class="hidden"
                  @change="onPicked(r.id, $event)"
                />
                <div v-if="r.file" class="h-10 px-3 rounded-md border flex items-center gap-2 text-sm" :class="extBadgeClass(fileExt(r.file))">
                  <span class="font-semibold">{{ fileExt(r.file) }}</span>
                  <span class="truncate">— {{ r.file?.name }}</span>
                  <div v-if="r.uploading" class="ms-auto">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  </div>
                  <div v-if="r.uploadError" class="ms-auto text-red-500 text-xs">
                    {{ r.uploadError }}
                  </div>
                </div>
              </div>

              <div>
                <Label class="!text-[#171717] !mb-3"
                  >{{ t("fileDialogs.addDocument.documentName") }}<span class="text-red-500">{{ t("fileDialogs.common.required") }}</span></Label
                >
                <Input v-model="r.name" :placeholder="t('fileDialogs.addDocument.namePlaceholder')" />
              </div>
            </div>

            <!-- Lock + ACL (per card) -->
            <div class="space-y-3">
              <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="r.locked" type="checkbox" class="accent-primary" />
                <span class="flex items-center gap-1"> {{ t("fileDialogs.addDocument.lockDocument") }} </span>
              </label>

              <div v-if="r.locked" class="space-y-3">
                <Label class="!text-[#171717] !mb-3">{{ t("fileDialogs.addDocument.selectWhoView") }}</Label>

                <RadioGroup v-model="r.viewBy" :class="['flex gap-4', isRtl ? 'flex-row-reverse' : '']">
                  <div
                    :class="[
                      'flex items-center w-[48%] border rounded-md p-2 cursor-pointer',
                      r.viewBy === 'role' ? 'border-primary' : 'border-gray-200',
                      isRtl ? 'flex-row-reverse' : '',
                    ]"
                    @click="r.viewBy = 'role'"
                  >
                    <Label for="role" :class="['font-normal cursor-pointer flex items-center gap-2', isRtl ? 'flex-row-reverse' : '']">
                      <RadioGroupItem id="role" value="role" /> {{ t("fileDialogs.common.byRole") }}
                    </Label>
                  </div>
                  <div
                    :class="[
                      'flex items-center w-[48%] border rounded-md p-2 cursor-pointer',
                      r.viewBy === 'users' ? 'border-primary' : 'border-gray-200',
                      isRtl ? 'flex-row-reverse' : '',
                    ]"
                    @click="r.viewBy = 'users'"
                  >
                    <Label for="users" :class="['font-normal cursor-pointer flex items-center gap-2', isRtl ? 'flex-row-reverse' : '']">
                      <RadioGroupItem id="users" value="users" /> {{ t("fileDialogs.common.byUsers") }}
                    </Label>
                  </div>
                </RadioGroup>

                <div v-if="r.viewBy === 'role'" class="flex flex-col gap-2">
                  <Label>Roles</Label>
                  <div class="border rounded-md p-2 flex flex-col gap-2">
                    <Input v-model="searchRoles" :placeholder="t('fileDialogs.common.searchRoles')" />
                    <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      <div v-if="filteredRoles.length === 0" class="text-gray-500 text-sm py-2 text-center">{{ t("fileDialogs.common.noRolesAvailable") }}</div>
                      <label v-for="role in filteredRoles" :key="role.id" class="flex items-center gap-2 cursor-pointer">
                        <input v-model="r.selectedRoles" type="checkbox" :value="role.name" class="accent-primary" />
                        <span>{{ role.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div v-if="r.viewBy === 'users'" class="flex flex-col gap-2">
                  <Label>Users</Label>
                  <div class="border rounded-md p-2 flex flex-col gap-2">
                    <Input v-model="searchUsers" :placeholder="t('fileDialogs.common.searchUsers')" />
                    <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      <div v-if="filteredUsers.length === 0" class="text-gray-500 text-sm py-2 text-center">{{ t("fileDialogs.common.noUsersAvailable") }}</div>
                      <label v-for="user in filteredUsers" :key="user.id" class="flex items-center gap-2 cursor-pointer">
                        <input v-model="r.selectedUsers" type="checkbox" :value="user.name" class="accent-primary" />
                        <span>{{ user.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add New Document -->
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-2 text-[#2aa1bf] hover:text-[#1a8aa3] disabled:text-gray-400"
              :disabled="rows.length >= MAX_DOCS"
              @click="addRow"
            >
              <PlusCircle class="w-5 h-5" />
              <span class="font-medium">{{ t("fileDialogs.addDocument.addNewDocument") }}</span>
              <span class="ms-1 text-gray-500">({{ rows.length }}/{{ MAX_DOCS }})</span>
            </button>
            <span v-if="rows.length >= MAX_DOCS" class="text-sm text-red-500"> {{ t("fileDialogs.addDocument.maximum", { max: MAX_DOCS }) }} </span>
          </div>
        </div>

        <div class="px-5 pb-5 pt-3 border-t bg-white shrink-0">
          <div class="flex items-center justify-between">
            <DialogClose as-child>
              <Button class="bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer border w-[48%]"> {{ t("fileDialogs.common.cancel") }} </Button>
            </DialogClose>
            <Button class="bg-primary cursor-pointer text-white w-[48%]" :disabled="!canSave" @click="save"> {{ t("fileDialogs.common.add") }} </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
<style scoped>
input[type="checkbox"]:checked {
  accent-color: #111111;
}
input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
</style>
