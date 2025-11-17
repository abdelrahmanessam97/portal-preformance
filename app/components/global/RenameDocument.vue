<!-- app/components/global/RenameDocument.vue -->
<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccessibilityUpdate } from "@/composables/files/useAccessibilityUpdate";
import { Loader2 } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { z } from "zod";

const { t } = useI18n();

const props = defineProps<{
  isOpen: boolean;
  attachmentTitle: string;
  attachmentId: number;
}>();

const emit = defineEmits<{
  (e: "close" | "renamed"): void;
}>();

const titleSchema = computed(() =>
  z.object({
    title: z.string().min(1, t("fileDialogs.rename.titleRequired")),
  })
);

const title = ref("");
const errors = ref<Record<string, string>>({});
const submitting = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      title.value = props.attachmentTitle || "";
      errors.value = {};
    }
  }
);

const handleRename = async () => {
  if (submitting.value || !props.attachmentId) return;

  const result = titleSchema.value.safeParse({
    title: title.value.trim(),
  });

  if (!result.success) {
    errors.value = {};
    result.error.issues.forEach((issue) => {
      errors.value[issue.path[0] as string] = issue.message;
    });
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      title: title.value.trim(),
    };

    const updateResult = await useAccessibilityUpdate(props.attachmentId, payload);

    if (updateResult.error || updateResult.status >= 400) {
      toast.error(updateResult.message || t("fileDialogs.rename.renameFailed"));
      errors.value["general"] = updateResult.message || t("fileDialogs.rename.renameFailed");
      submitting.value = false;
      return;
    }

    // Show success message from API response
    toast.success(updateResult.message || t("fileDialogs.rename.updatedSuccess"));
    emit("renamed");
    submitting.value = false;
    closeDialog();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors.value["general"] = t("fileDialogs.rename.failedToRename", { errorMessage });
    toast.error(t("fileDialogs.rename.renameFailed"), { description: errors.value["general"] });
    submitting.value = false;
  }
};

const closeDialog = () => {
  emit("close");
  errors.value = {};
  title.value = "";
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50 p-4" @click.self="closeDialog">
    <div class="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-md">
      <h2 class="text-base sm:text-xl font-bold text-[#171717] mb-4">{{ t("fileDialogs.rename.title") }}</h2>
      <form class="space-y-4" @submit.prevent="handleRename">
        <div v-if="errors.general" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-600 text-sm">{{ errors.general }}</p>
        </div>

        <div>
          <Label for="title" class="block text-xs sm:text-sm font-medium text-gray-500 mb-2">
            {{ t("fileDialogs.rename.documentName") }} <span class="text-red-500">{{ t("fileDialogs.common.required") || "*" }}</span>
          </Label>
          <Input
            id="title"
            v-model="title"
            type="text"
            :class="['w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500', { 'border-red-500': errors.title }]"
            :disabled="submitting"
            :placeholder="t('fileDialogs.rename.enterDocumentName')"
          />
          <p v-if="errors.title" class="text-xs text-red-500 mt-1">{{ errors.title }}</p>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <button type="button" class="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" :disabled="submitting" @click="closeDialog">
            {{ t("fileDialogs.common.cancel") || "Cancel" }}
          </button>
          <button type="submit" class="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center justify-center" :disabled="submitting">
            <span v-if="!submitting">{{ t("fileDialogs.common.save") || "Save" }}</span>
            <Loader2 v-else class="w-5 h-5 animate-spin" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
