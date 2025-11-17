<!-- /app/components/home/HomeAddNewsDialog.vue -->
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useUpload } from "@/composables/uploads/useUpload";
import { CirclePlus, Loader2 } from "lucide-vue-next";
import { ref } from "vue";
import { toast } from "vue-sonner";
import type { ZodError } from "zod";
import { z } from "zod";

const { t } = useI18n();

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit-news", data: { en: { title: string; description: string }; ar: { title: string; description: string }; attachmentIds: number[] }): void;
}>();

const newNews = ref({
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
});

const imagePreviews = ref<string[]>([]);
const selectedFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const submitting = ref(false);
const uploadingFiles = ref<Set<number>>(new Set()); // Track which files are being uploaded
const errors = ref<Record<string, string>>({});

// Zod validation schema
const newsSchema = z.object({
  titleEn: z.string().min(1, t("home.news.validationTitleEn")),
  titleAr: z.string().min(1, t("home.news.validationTitleAr")),
  descriptionEn: z.string().min(1, t("home.news.validationDescEn")),
  descriptionAr: z.string().min(1, t("home.news.validationDescAr")),
});

const previewImage = (event: Event) => {
  if (submitting.value) return;
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (files) {
    const totalFiles = imagePreviews.value.length + files.length;
    const maxFiles = 5;

    if (totalFiles > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} images.`);
      if (fileInput.value) fileInput.value.value = "";
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        selectedFiles.value.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          imagePreviews.value.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }
  if (fileInput.value) fileInput.value.value = "";
};

const removeImage = (index: number) => {
  if (submitting.value) return;
  imagePreviews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};

const submitNews = async () => {
  if (submitting.value) return;

  // Validate with Zod
  const result = newsSchema.safeParse({
    titleEn: newNews.value.titleEn.trim(),
    titleAr: newNews.value.titleAr.trim(),
    descriptionEn: newNews.value.descriptionEn.trim(),
    descriptionAr: newNews.value.descriptionAr.trim(),
  });

  if (!result.success) {
    const zodError: ZodError = result.error;
    errors.value = {};
    zodError.issues.forEach((issue) => {
      errors.value[issue.path[0] as string] = issue.message;
    });
    return;
  }

  // Clear errors if validation passes
  errors.value = {};

  submitting.value = true;

  try {
    // Upload images one by one with individual loading states
    const attachmentIds: number[] = [];
    let hasUploadErrors = false;

    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i];
      uploadingFiles.value.add(i);

      try {
        if (!file) continue;
        const { data: uploadData, error } = await useUpload(file, file.name, "image");
        if (error) {
          toast.error(error);
          hasUploadErrors = true;
          // Continue checking other files but mark that we have errors
        } else if (uploadData) {
          attachmentIds.push(uploadData.data.id);
        }
      } catch (error: unknown) {
        // Extract error message from API response
        const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
        toast.error(errorMessage);
        hasUploadErrors = true;
      } finally {
        uploadingFiles.value.delete(i);
      }
    }

    // Only proceed with create if all uploads succeeded
    if (hasUploadErrors) {
      errors.value["general"] = "Please fix upload errors before submitting";
      submitting.value = false;
      uploadingFiles.value.clear();
      return; // Keep dialog open, don't emit submit-news
    }

    // Emit the data with attachment IDs only if all uploads succeeded
    emit("submit-news", {
      en: { title: newNews.value.titleEn.trim(), description: newNews.value.descriptionEn.trim() },
      ar: { title: newNews.value.titleAr.trim(), description: newNews.value.descriptionAr.trim() },
      attachmentIds,
    });

    // Don't reset form here - let the parent close the dialog and trigger reset via closeDialog()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to upload images";
    toast.error("Upload failed", { description: errorMessage });
    errors.value["general"] = errorMessage;
  } finally {
    submitting.value = false;
    uploadingFiles.value.clear();
  }
};

const resetForm = () => {
  newNews.value = {
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
  };
  imagePreviews.value = [];
  selectedFiles.value = [];
  uploadingFiles.value.clear();
  errors.value = {};
  if (fileInput.value) fileInput.value.value = "";
};

const closeDialog = () => {
  if (submitting.value) return;
  emit("close");
  resetForm();
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" @click.self="closeDialog">
    <div class="bg-white rounded-lg p-6 w-full max-w-xl shadow-md h-auto max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">{{ t("home.news.addDialogTitle") }}</h2>
      <form class="space-y-4" @submit.prevent="submitNews">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="titleEn" class="block text-sm font-medium text-gray-500"
              >{{ t("home.news.titleEnglish") }} <span class="text-red-500">{{ t("home.news.required") }}</span></label
            >
            <input
              id="titleEn"
              v-model="newNews.titleEn"
              type="text"
              class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              :class="{ 'border-red-500': errors.titleEn }"
              :disabled="submitting"
            />
            <p v-if="errors.titleEn" class="text-red-500 text-sm mt-1">{{ errors.titleEn }}</p>
          </div>
          <div>
            <label for="titleAr" class="block text-sm font-medium text-gray-500"
              >{{ t("home.news.titleArabic") }} <span class="text-red-500">{{ t("home.news.required") }}</span></label
            >
            <input
              id="titleAr"
              v-model="newNews.titleAr"
              type="text"
              dir="rtl"
              class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              :class="{ 'border-red-500': errors.titleAr }"
              :disabled="submitting"
            />
            <p v-if="errors.titleAr" class="text-red-500 text-sm mt-1">{{ errors.titleAr }}</p>
          </div>
        </div>
        <div>
          <label for="descriptionEn" class="block text-sm font-medium text-gray-500"
            >{{ t("home.news.descriptionEnglish") }} <span class="text-red-500">{{ t("home.news.required") }}</span></label
          >
          <textarea
            id="descriptionEn"
            v-model="newNews.descriptionEn"
            class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            :class="{ 'border-red-500': errors.descriptionEn }"
            rows="3"
            :disabled="submitting"
          />
          <p v-if="errors.descriptionEn" class="text-red-500 text-sm mt-1">{{ errors.descriptionEn }}</p>
        </div>
        <div>
          <label for="descriptionAr" class="block text-sm font-medium text-gray-500"
            >{{ t("home.news.descriptionArabic") }} <span class="text-red-500">{{ t("home.news.required") }}</span></label
          >
          <textarea
            id="descriptionAr"
            v-model="newNews.descriptionAr"
            dir="rtl"
            class="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            :class="{ 'border-red-500': errors.descriptionAr }"
            rows="3"
            :disabled="submitting"
          />
          <p v-if="errors.descriptionAr" class="text-red-500 text-sm mt-1">{{ errors.descriptionAr }}</p>
        </div>
        <div class="relative">
          <label for="image" class="flex items-center text-sm font-medium text-primary cursor-pointer" :class="{ 'opacity-50 cursor-not-allowed': submitting }">
            <CirclePlus class="w-5 h-5 me-1" /> {{ t("home.news.addPhoto") }}
          </label>
          <input id="image" ref="fileInput" type="file" accept="image/*" multiple class="hidden" :disabled="submitting" @change="previewImage" />
          <div v-if="imagePreviews.length > 0" class="mt-2 flex flex-wrap gap-2">
            <div v-for="(image, index) in imagePreviews" :key="index" class="relative">
              <img :src="image" alt="Image Preview" class="w-20 h-20 object-cover rounded-md border border-gray-300" />
              <!-- Loading indicator for uploads -->
              <div v-if="uploadingFiles.has(index)" class="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                <Loader2 class="w-4 h-4 text-white animate-spin" />
              </div>
              <button
                type="button"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                :disabled="submitting"
                @click="removeImage(index)"
              >
                &times;
              </button>
            </div>
          </div>
          <p v-if="errors.general" class="text-red-500 text-sm mt-1">{{ errors.general }}</p>
        </div>
        <div class="flex items-center justify-between">
          <Button class="bg-white border w-[48%] text-[#1E1E1E] hover:bg-gray-100 hover:text-[#1E1E1E] hover:border-gray-300" :disabled="submitting" @click="closeDialog">
            {{ t("home.news.cancel") }}
          </Button>
          <Button type="submit" class="bg-primary text-white w-[48%] flex items-center justify-center" :disabled="submitting">
            <span v-if="!submitting">{{ t("home.news.add") }}</span>
            <Loader2 v-else class="w-5 h-5 animate-spin" />
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
