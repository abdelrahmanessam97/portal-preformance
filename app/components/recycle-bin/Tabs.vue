<!-- app/components/recycle-bin/Tabs.vue -->
<script setup lang="ts">
type TabType = "categories" | "folders" | "files" | "documents";

const props = defineProps<{ active: TabType }>();
const emit = defineEmits<{ (e: "update:active", tab: TabType): void }>();

const { t } = useI18n();

const tabs: { label: string; value: TabType }[] = [
  { label: t("recycleBin.tabs.categories"), value: "categories" },
  { label: t("recycleBin.tabs.folders"), value: "folders" },
  { label: t("recycleBin.tabs.files"), value: "files" },
  { label: t("recycleBin.tabs.documents"), value: "documents" },
];
</script>

<template>
  <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full justify-start sm:justify-normal">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :class="[
        'px-4 sm:px-5 py-2 rounded-md border text-sm sm:text-base font-medium transition-colors text-center',
        props.active === tab.value ? 'border-sky-400 text-sky-500 bg-transparent' : 'border-gray-300 text-gray-600 hover:border-gray-400',
      ]"
      @click="emit('update:active', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
