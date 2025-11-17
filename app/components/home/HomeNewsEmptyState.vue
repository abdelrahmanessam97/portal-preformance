<!-- /app/components/home/HomeNewsEmptyState.vue -->
<script setup lang="ts">
import { Newspaper } from "lucide-vue-next";

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
    <Newspaper class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
    <h3 class="text-base sm:text-xl font-semibold">{{ t("home.news.emptyState") }}</h3>
    <!-- <p class="text-gray-500 max-w-xs sm:max-w-sm text-sm sm:text-base">
      There are no news items to display at the moment. Add a new announcement to get started.
    </p> -->
  </div>
</template>
