<!-- /app/components/home/HomeNewsCard.vue -->
<script setup lang="ts">
import { Pencil, Trash2 } from "lucide-vue-next";
import { computed } from "vue";

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

const { locale, t } = useI18n();

const props = defineProps<{
  newsItem: NewsItem;
  disabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit-news" | "delete-news", id: number): void;
}>();

const title = computed(() => (locale.value === "ar" ? props.newsItem.titleAr : props.newsItem.titleEn));
const description = computed(() => (locale.value === "ar" ? props.newsItem.descriptionAr : props.newsItem.descriptionEn));

const handleEdit = () => {
  if (!props.disabled) emit("edit-news", props.newsItem.id);
};

const handleDelete = () => {
  if (!props.disabled) emit("delete-news", props.newsItem.id);
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "/path/to/fallback-image.jpg"; // Replace with your actual fallback image path
};
</script>

<template>
  <div class="mb-0">
    <div class="bg-white rounded-xl border p-4 sm:p-5 md:p-6 shadow-sm">
      <div v-if="newsItem.images.length" class="flex flex-wrap gap-2 sm:gap-3 mb-3">
        <div v-for="(image, index) in newsItem.images" :key="index" class="w-28 h-28 sm:w-32 sm:h-32 overflow-hidden rounded-md shadow-sm">
          <img :src="image" alt="News Image" class="w-full h-full object-cover" @error="handleImageError" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="font-semibold text-gray-800 text-base sm:text-lg md:text-xl">{{ title }}</h3>
        <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">{{ description }}</p>

        <div class="flex justify-end gap-2 mt-2">
          <button
            v-if="canEdit"
            class="rounded-lg bg-white text-[#0080a5] border border-[#0080a5] hover:bg-[#e6f7fa] hover:border-[#006d8a] hover:text-[#006d8a] cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-xs sm:text-sm"
            :disabled="disabled"
            @click="handleEdit"
          >
            <Pencil class="h-4 w-4" />
            <span class="hidden sm:inline">{{ t("home.news.edit") }}</span>
          </button>

          <button
            v-if="canDelete"
            class="rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer h-8 w-8 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-xs sm:text-sm"
            :disabled="disabled"
            @click="handleDelete"
          >
            <Trash2 class="h-4 w-4" />
            <span class="hidden sm:inline">{{ t("home.news.delete") }}</span>
          </button>
        </div>
      </div>
    </div>

    <span class="mt-2 block text-xs text-gray-400">{{ newsItem.date }} {{ t("home.news.at") }} {{ newsItem.time }}</span>
  </div>
</template>
