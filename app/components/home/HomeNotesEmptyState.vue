<script setup lang="ts">
import { ClipboardList } from "lucide-vue-next";

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
    <ClipboardList class="w-16 h-16 mb-4" />
    <h3 class="text-base sm:text-xl font-semibold">{{ t("home.notes.emptyState") }}</h3>
    <!-- <p class="text-gray-500 max-w-xs sm:max-w-sm text-sm sm:text-base">
      There are no notes items to display at the moment. Add a new note to get
      started.
    </p> -->
  </div>
</template>
