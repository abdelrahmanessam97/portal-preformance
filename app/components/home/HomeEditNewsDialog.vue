<!-- /app/components/home/HomeEditNewsDialog.vue -->
<script setup lang="ts">
import { useDeleteImage } from "@/composables/uploads/useDeleteImage";
import { useUpload } from "@/composables/uploads/useUpload";
import { CirclePlus, Loader2 } from "lucide-vue-next";
import { ref, watch } from "vue";
import { toast } from "vue-sonner";
import type { ZodError } from "zod";
import { z } from "zod";
import type { UpdateNewsPayload } from "../../../types/news";

const { t } = useI18n();

interface NewsItem {
  id: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  images: string[];
  attachmentIds: number[];
  author: string;
  date: string;
  time: string;
}

const props = defineProps<{
  isOpen: boolean;
  newsItem: NewsItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update-news", data: { id: number; payload: UpdateNewsPayload }): void;
}>();

const newsSchema = z.object({
  titleEn: z.string().min(1, t("home.news.validationTitleEn")),
  titleAr: z.string().min(1, t("home.news.validationTitleAr")),
  descriptionEn: z.string().min(1, t("home.news.validationDescEn")),
  descriptionAr: z.string().min(1, t("home.news.validationDescAr")),
});

const editableNews = ref<NewsItem | null>(null);
const existingPreviews = ref<string[]>([]);
const newPreviews = ref<string[]>([]);
const keptAttachmentIds = ref<number[]>([]);
const newFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const errors = ref<Record<string, string>>({});
const submitting = ref(false);
const uploadingFiles = ref<Set<number>>(new Set()); // Track which files are being uploaded

watch(
  () => props.newsItem,
  (item) => {
    if (item) {
      editableNews.value = { ...item };
      existingPreviews.value = [...item.images];
      keptAttachmentIds.value = [...item.attachmentIds];
      newPreviews.value = [];
      newFiles.value = [];
      uploadingFiles.value.clear();
      errors.value = {};
    } else {
      editableNews.value = null;
      existingPreviews.value = [];
      keptAttachmentIds.value = [];
      newPreviews.value = [];
      newFiles.value = [];
      uploadingFiles.value.clear();
      errors.value = {};
    }
  },
  { immediate: true }
);

const previewImage = (event: Event) => {
  if (submitting.value) return;
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (files && editableNews.value) {
    const totalFiles = existingPreviews.value.length + newPreviews.value.length + files.length;
    const maxFiles = 5;

    if (totalFiles > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} images.`);
      if (fileInput.value) fileInput.value.value = "";
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        newFiles.value.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          newPreviews.value.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }
  if (fileInput.value) fileInput.value.value = "";
};

const removeImage = (index: number) => {
  if (submitting.value) return;
  const existingCount = existingPreviews.value.length;
  if (index < existingCount) {
    // Remove existing image and delete it from server immediately
    const attachmentId = keptAttachmentIds.value[index];
    existingPreviews.value.splice(index, 1);
    keptAttachmentIds.value.splice(index, 1);

    // Delete the image from server immediately
    if (attachmentId) {
      useDeleteImage(attachmentId).catch((err: unknown) => {
        const errorMessage = err as { message?: string } | null;
        toast.error(errorMessage?.message || "Failed to delete image");
        // Don't show error to user, just log it
      });
    }
  } else {
    // Remove new image (not yet uploaded)
    const newIdx = index - existingCount;
    newPreviews.value.splice(newIdx, 1);
    newFiles.value.splice(newIdx, 1);
  }
};

const updateNews = async () => {
  if (submitting.value || !editableNews.value) return;

  const result = newsSchema.safeParse({
    titleEn: editableNews.value.titleEn.trim(),
    titleAr: editableNews.value.titleAr.trim(),
    descriptionEn: editableNews.value.descriptionEn.trim(),
    descriptionAr: editableNews.value.descriptionAr.trim(),
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
    // Upload new files one by one with individual loading states
    const newIds: number[] = [];
    let hasUploadErrors = false;

    for (let i = 0; i < newFiles.value.length; i++) {
      const file = newFiles.value[i];
      if (!file) continue; // Skip if file is undefined

      uploadingFiles.value.add(i);

      try {
        const { data: uploadData, error } = await useUpload(file, file.name, "image");
        if (error) {
          toast.error(error);
          hasUploadErrors = true;
          // Continue checking other files but mark that we have errors
        } else if (uploadData) {
          newIds.push(uploadData.data.id);
        }
      } catch (err: unknown) {
        // Extract error message from API response
        const errorMessage = err instanceof Error ? err.message : (err as { message?: string } | null);
        toast.error(typeof errorMessage === "string" ? errorMessage : errorMessage?.message || `Failed to upload image ${i + 1}`);
        hasUploadErrors = true;
      } finally {
        uploadingFiles.value.delete(i);
      }
    }

    // Only proceed with update if all uploads succeeded
    if (hasUploadErrors) {
      submitting.value = false;
      uploadingFiles.value.clear();
      return; // Keep dialog open, don't emit update-news
    }

    const payload: UpdateNewsPayload = {
      en: {
        title: editableNews.value.titleEn.trim(),
        description: editableNews.value.descriptionEn.trim(),
      },
      ar: {
        title: editableNews.value.titleAr.trim(),
        description: editableNews.value.descriptionAr.trim(),
      },
      attachments: [...keptAttachmentIds.value, ...newIds],
    };

    emit("update-news", { id: editableNews.value.id, payload });

    // Reset form after successful submission
    newFiles.value = [];
    newPreviews.value = [];
    uploadingFiles.value.clear();
    errors.value = {};
    if (fileInput.value) fileInput.value.value = "";
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    errors.value["general"] = `Failed to update news: ${errorMessage}`;
    toast.error("Failed to update news", { description: errors.value["general"] });
  } finally {
    submitting.value = false;
    uploadingFiles.value.clear();
  }
};

const closeDialog = () => {
  if (submitting.value) return;
  emit("close");
  newFiles.value = [];
  newPreviews.value = [];
  uploadingFiles.value.clear();
  errors.value = {};
  if (fileInput.value) fileInput.value.value = "";
};
</script>

<template>
  <div v-if="isOpen && editableNews" class="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50 p-4" @click.self="closeDialog">
    <div class="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xl shadow-md h-auto max-h-[90vh] overflow-y-auto">
      <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-4">{{ t("home.news.editDialogTitle") }}</h2>
      <form class="space-y-3 sm:space-y-4" @submit.prevent="updateNews">
        <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
          <div class="w-full sm:w-1/2">
            <label for="edit-titleEn" class="block text-xs sm:text-sm font-medium text-gray-700">
              {{ t("home.news.titleEnglish") }} <span class="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="edit-titleEn"
              v-model="editableNews.titleEn"
              type="text"
              class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              :class="{ 'border-red-500': errors.titleEn }"
              :disabled="submitting"
              :aria-invalid="!!errors.titleEn"
              :aria-describedby="errors.titleEn ? 'edit-titleEn-error' : undefined"
              aria-required="true"
            />
            <p v-if="errors.titleEn" id="edit-titleEn-error" class="text-xs text-red-500 mt-1" role="alert">
              {{ errors.titleEn }}
            </p>
          </div>
          <div class="w-full sm:w-1/2">
            <label for="edit-titleAr" class="block text-xs sm:text-sm font-medium text-gray-700">
              {{ t("home.news.titleArabic") }} <span class="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="edit-titleAr"
              v-model="editableNews.titleAr"
              type="text"
              dir="rtl"
              class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              :class="{ 'border-red-500': errors.titleAr }"
              :disabled="submitting"
              :aria-invalid="!!errors.titleAr"
              :aria-describedby="errors.titleAr ? 'edit-titleAr-error' : undefined"
              aria-required="true"
            />
            <p v-if="errors.titleAr" id="edit-titleAr-error" class="text-xs text-red-500 mt-1" role="alert">
              {{ errors.titleAr }}
            </p>
          </div>
        </div>

        <div>
          <label for="edit-descriptionEn" class="block text-xs sm:text-sm font-medium text-gray-700">
            {{ t("home.news.descriptionEnglish") }} <span class="text-red-500" aria-label="required">*</span>
          </label>
          <textarea
            id="edit-descriptionEn"
            v-model="editableNews.descriptionEn"
            class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            :class="{ 'border-red-500': errors.descriptionEn }"
            rows="3"
            :disabled="submitting"
            :aria-invalid="!!errors.descriptionEn"
            :aria-describedby="errors.descriptionEn ? 'edit-descriptionEn-error' : undefined"
            aria-required="true"
          />
          <p v-if="errors.descriptionEn" id="edit-descriptionEn-error" class="text-xs text-red-500 mt-1" role="alert">
            {{ errors.descriptionEn }}
          </p>
        </div>
        <div>
          <label for="edit-descriptionAr" class="block text-xs sm:text-sm font-medium text-gray-700">
            {{ t("home.news.descriptionArabic") }} <span class="text-red-500" aria-label="required">*</span>
          </label>
          <textarea
            id="edit-descriptionAr"
            v-model="editableNews.descriptionAr"
            dir="rtl"
            class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            :class="{ 'border-red-500': errors.descriptionAr }"
            rows="3"
            :disabled="submitting"
            :aria-invalid="!!errors.descriptionAr"
            :aria-describedby="errors.descriptionAr ? 'edit-descriptionAr-error' : undefined"
            aria-required="true"
          />
          <p v-if="errors.descriptionAr" id="edit-descriptionAr-error" class="text-xs text-red-500 mt-1" role="alert">
            {{ errors.descriptionAr }}
          </p>
        </div>

        <div class="relative">
          <label
            for="edit-image"
            class="flex items-center text-sm sm:text-base font-medium text-primary cursor-pointer"
            :class="{ 'opacity-50 cursor-not-allowed': submitting }"
          >
            <CirclePlus class="w-5 h-5" aria-hidden="true" />
            <span class="ms-1">{{ t("home.news.addPhoto") }}</span>
          </label>
          <input
            id="edit-image"
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            :disabled="submitting"
            aria-describedby="edit-image-error"
            @change="previewImage"
          />
          <div v-if="[...existingPreviews, ...newPreviews].length > 0" class="mt-2 flex flex-wrap gap-2">
            <div v-for="(image, index) in [...existingPreviews, ...newPreviews]" :key="index" class="relative">
              <img :src="image" :alt="`News image preview ${index + 1}`" class="w-20 h-20 object-cover rounded-md border border-gray-300" width="80" height="80" />
              <!-- Loading indicator for new uploads -->
              <div
                v-if="index >= existingPreviews.length && uploadingFiles.has(index - existingPreviews.length)"
                class="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center"
                role="status"
                aria-busy="true"
                aria-live="polite"
              >
                <Loader2 class="w-4 h-4 text-white animate-spin" aria-hidden="true" />
              </div>
              <button
                type="button"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
                :disabled="submitting"
                :aria-label="`Remove image ${index + 1}`"
                @click="removeImage(index)"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
          <p v-if="errors.general" id="edit-image-error" class="text-xs text-red-500 mt-1" role="alert">
            {{ errors.general }}
          </p>
        </div>

        <div class="flex w-full space-x-2">
          <button
            type="button"
            class="flex-1 px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 h-11 sm:h-10 transition-colors"
            :disabled="submitting"
            @click="closeDialog"
          >
            {{ t("home.news.cancel") }}
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 text-sm sm:text-base bg-primary text-white rounded-md hover:bg-primary/90 flex items-center justify-center h-11 sm:h-10 transition-colors"
            :disabled="submitting"
            :aria-busy="submitting"
          >
            <span v-if="!submitting">{{ t("home.news.saveChanges") }}</span>
            <Loader2 v-else class="w-5 h-5 animate-spin" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
