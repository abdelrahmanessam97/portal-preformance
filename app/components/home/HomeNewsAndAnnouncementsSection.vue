<!-- /app/components/home/HomeNewsAndAnnouncementsSection.vue -->
<script setup lang="ts">
import { useCreate } from "@/composables/news/useCreate";
import { useDelete } from "@/composables/news/useDelete";
import { useFetchNews } from "@/composables/news/useFetchNews";
import { useGetNewsOne } from "@/composables/news/useGetNewsOne";
import { useUpdate } from "@/composables/news/useUpdate";
import { Plus, X } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { usePermissions } from "~/composables/usePermissions";
import type { CreateNewsPayload, NewsItem, UpdateNewsPayload } from "../../../types/news";
import Separator from "../ui/separator/Separator.vue";
import HomeAddNewsDialog from "./HomeAddNewsDialog.vue";
import HomeEditNewsDialog from "./HomeEditNewsDialog.vue";
import NewsCard from "./HomeNewsCard.vue";
import HomeNewsEmptyState from "./HomeNewsEmptyState.vue";

const { t } = useI18n();
const { canCreate, canUpdate, canDelete } = usePermissions();

const newsItems = ref<NewsItem[]>([]);
const isDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingItem = ref<NewsItem | null>(null);
const loading = ref(false);
const submitting = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await useFetchNews();
    if (res.error) {
      toast.error("Failed to fetch news", { description: res.message || "Unknown error" });
      newsItems.value = [];
    } else {
      newsItems.value = res.data ?? [];
    }
  } catch {
    toast.error("Failed to fetch news");
  } finally {
    loading.value = false;
  }
});

const openDialog = () => {
  isDialogOpen.value = true;
};

const handleNewsSubmit = async (data: { en: { title: string; description: string }; ar: { title: string; description: string }; attachmentIds: number[] }) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const payload: CreateNewsPayload = {
      en: data.en,
      ar: data.ar,
      attachments: data.attachmentIds,
    };

    const res = await useCreate(payload);
    if (res.error || !res.data) {
      throw new Error(res.message || "Create failed");
    }

    newsItems.value.unshift(res.data); // Update UI after backend success
    isDialogOpen.value = false;
    toast.success(res.message); // Use API message directly
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    toast.error(` ${errorMessage}`);
  } finally {
    submitting.value = false;
  }
};

const handleDeleteNews = async (id: number) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await useDelete(id);
    if (res.error) throw new Error(res.message || "Delete failed");

    newsItems.value = newsItems.value.filter((n) => n.id !== id);
    toast.success(res.message); // Use API message directly
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    toast.error(errorMessage);
  } finally {
    submitting.value = false;
  }
};

const handleEditNews = async (id: number) => {
  if (submitting.value) return;
  try {
    const res = await useGetNewsOne(id);
    if (res.error || !res.data) throw new Error(res.message || "Fetch failed");

    editingItem.value = { ...res.data };
    isEditDialogOpen.value = true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not fetch the latest data for this item.";
    toast.error(msg);
  }
};

const handleUpdateNews = async (data: { id: number; payload: UpdateNewsPayload }) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await useUpdate(data.id, data.payload);
    if (res.error || !res.data) throw new Error(res.message || "Update failed");

    const i = newsItems.value.findIndex((n) => n.id === data.id);
    if (i !== -1) newsItems.value[i] = res.data;
    isEditDialogOpen.value = false;
    toast.success(res.message); // Use API message directly
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not update the news item.";
    toast.error("Update failed", { description: msg });
  } finally {
    submitting.value = false;
  }
};
</script>
<template>
  <section class="mt-8 sm:mt-10 rounded-xl p-4 sm:p-6 bg-white shadow-sm border">
    <div class="flex items-center justify-between">
      <h2 class="text-lg sm:text-xl font-bold">{{ t("home.news.title") }}</h2>
      <template v-if="canCreate('news')">
        <button
          v-if="!isDialogOpen"
          type="button"
          class="rounded-full text-white h-11 w-11 sm:h-8 sm:w-8 bg-primary hover:bg-primary/80 transition-colors"
          :aria-label="t('home.news.add') || 'Add news'"
          :disabled="submitting"
          @click="openDialog"
        >
          <Plus class="w-4 h-4 mx-auto" aria-hidden="true" />
        </button>
        <button
          v-else
          type="button"
          class="rounded-full text-white h-11 w-11 sm:h-9 sm:w-9 bg-gray-600 hover:bg-red-500 transition-colors"
          :aria-label="t('home.news.cancel') || 'Cancel adding news'"
          :disabled="submitting"
          @click="isDialogOpen = false"
        >
          <X class="w-5 h-5 mx-auto" aria-hidden="true" />
        </button>
      </template>
    </div>

    <Separator class="my-5" />

    <p v-if="loading" class="text-sm text-gray-500">{{ t("home.news.loading") }}</p>

    <div v-if="newsItems.length" class="max-h-[60rem] overflow-y-auto px-1 sm:px-2">
      <NewsCard
        v-for="item in newsItems"
        :key="item.id"
        :news-item="item"
        :disabled="submitting"
        :can-edit="canUpdate('news')"
        :can-delete="canDelete('news')"
        @delete-news="handleDeleteNews"
        @edit-news="handleEditNews"
      />
    </div>
    <div v-else-if="!loading">
      <HomeNewsEmptyState />
    </div>

    <HomeAddNewsDialog :is-open="isDialogOpen" @close="isDialogOpen = false" @submit-news="handleNewsSubmit" />

    <HomeEditNewsDialog :is-open="isEditDialogOpen" :news-item="editingItem" @close="isEditDialogOpen = false" @update-news="handleUpdateNews" />
  </section>
</template>
