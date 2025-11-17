<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";

const props = defineProps<{
  type: "categories" | "folders" | "files" | "documents";
}>();

const { t } = useI18n();

const getTitle = (type: string) => {
  switch (type) {
    case "categories":
      return t("recycleBin.emptyState.categories");
    case "folders":
      return t("recycleBin.emptyState.folders");
    case "files":
      return t("recycleBin.emptyState.files");
    case "documents":
      return t("recycleBin.emptyState.documents");
    default:
      return t("recycleBin.emptyState.default");
  }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
    <Trash2 class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
    <h3 class="text-base sm:text-xl font-semibold">{{ getTitle(props.type) }}</h3>
  </div>
</template>
