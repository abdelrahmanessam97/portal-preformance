<script setup lang="ts">
import { File, FileText, Folder, Search, Tag } from "lucide-vue-next";
import { computed } from "vue";
import RecycleBinEmptyState from "./RecycleBinEmptyState.vue";
type TabType = "categories" | "folders" | "files" | "documents";
type BinItem = { id: number | string; title?: string; name?: string };

const props = defineProps<{
  items: BinItem[];
  type: TabType;
  title: string;
  searchQuery?: string;
  canRestore?: boolean;
}>();

const emit = defineEmits<{
  (e: "restore", id: number | string): void;
  (e: "update:searchQuery", value: string): void;
}>();

const { t } = useI18n();

// Local search model with sync to parent via v-model:searchQuery
const localQuery = ref(props.searchQuery || "");

watch(
  () => props.searchQuery,
  (val) => {
    if (val !== undefined && val !== localQuery.value) localQuery.value = val;
  }
);

watch(localQuery, (val) => emit("update:searchQuery", val));

const filteredItems = computed(() => {
  const query = (localQuery.value || "").toLowerCase();
  if (!query) return props.items;
  return props.items.filter((item) => {
    const name = (item.title || item.name || "").toLowerCase();
    return name.includes(query);
  });
});

const getIcon = (type: TabType) => {
  switch (type) {
    case "categories":
      return Tag;
    case "folders":
      return Folder;
    case "files":
      return File;
    default:
      return FileText;
  }
};

const getDisplayName = (item: BinItem) => item.title || item.name || t("recycleBin.untitled");
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
    <table class="w-full text-sm" :class="$i18n.locale === 'ar' ? 'text-right' : 'text-left'">
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th class="py-3 px-4 text-cyan-700 font-semibold align-middle">
            {{ title }}
          </th>
          <th class="py-3 align-middle">
            <div class="flex justify-end px-2">
              <div class="relative w-50">
                <Input
                  id="search"
                  v-model="localQuery"
                  type="text"
                  :placeholder="t('recycleBin.searchPlaceholder')"
                  class="ps-10 pe-3 py-2 w-full border border-[#E5E5E5] rounded-md placeholder:text-[#A3A3A3] placeholder:font-normal text-sm"
                />
                <Search class="text-[#A3A3A3] text-sm h-5 w-5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          </th>
        </tr>
      </thead>

      <tbody v-if="filteredItems.length > 0">
        <tr v-for="item in filteredItems" :key="item.id" class="border-t border-gray-200 hover:bg-gray-50 transition">
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <component :is="getIcon(props.type)" class="w-5 h-5 text-cyan-700 shrink-0" />
              <span class="whitespace-nowrap">{{ getDisplayName(item) }}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-end">
            <button
              v-if="canRestore"
              class="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition whitespace-nowrap"
              @click="emit('restore', item.id)"
            >
              {{ t("recycleBin.restore") }}
            </button>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr>
          <td colspan="2" class="py-8">
            <RecycleBinEmptyState :type="props.type" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
