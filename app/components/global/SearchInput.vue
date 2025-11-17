<script setup lang="ts">
import { useLocalePath } from "#i18n";
import { useRouter } from "#imports";
import { Input } from "@/components/ui/input";
import { File, FileText, Folder, Loader2, Search, Tag, X } from "lucide-vue-next";
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from "vue";
import { searchByKey } from "~/composables/search/usefetchSearch";
import type { SearchItem } from "~~/types/search";

type Kind = "category" | "folder" | "file" | "attachment";

interface SearchResult {
  kind: Kind;
  id: number;
  title: string;
  link: string;
}

const localePath = useLocalePath();
const router = useRouter();
const { t } = useI18n();

// Refs
const showMobileSearch = ref(false);
const open = ref(false);
const q = ref("");
const searchedQ = ref("");
const loading = ref(false);
const results = ref<SearchResult[]>([]);
const activeIndex = ref(-1);
const isComposing = ref(false);
const searchError = ref<string | null>(null);
const hasSearched = ref(false);

// DOM refs
const desktopInputEl = ref<HTMLElement | ComponentPublicInstance | null>(null);
const desktopPanelEl = ref<HTMLElement | ComponentPublicInstance | null>(null);
const mobileInputEl = ref<HTMLElement | ComponentPublicInstance | null>(null);
const mobilePanelEl = ref<HTMLElement | ComponentPublicInstance | null>(null);

// DOM helper functions
function toDom(el: HTMLElement | ComponentPublicInstance | null | undefined): HTMLElement | null {
  if (!el) return null;
  if (typeof (el as HTMLElement).contains === "function") return el as HTMLElement;
  const root = (el as ComponentPublicInstance).$el as HTMLElement | undefined;
  return root ?? null;
}
function queryInput(el: HTMLElement | ComponentPublicInstance | null | undefined): HTMLInputElement | null {
  const dom = toDom(el);
  if (!dom) return null;
  return (dom.querySelector("input") as HTMLInputElement) ?? null;
}
function focusEl(el: HTMLElement | ComponentPublicInstance | null | undefined) {
  const input = queryInput(el);
  if (input) input.focus();
}
function blurEl(el: HTMLElement | ComponentPublicInstance | null | undefined) {
  const input = queryInput(el);
  if (input) input.blur();
}

// Main search
async function doSearch() {
  const query = q.value.trim();
  if (!query) {
    open.value = false;
    searchedQ.value = "";
    results.value = [];
    searchError.value = null;
    hasSearched.value = false;
    return;
  }

  searchedQ.value = query;
  loading.value = true;
  open.value = true;
  searchError.value = null;
  hasSearched.value = true;

  const { data, error } = await searchByKey(query);
  loading.value = false;

  if (error) {
    results.value = [];
    searchError.value = t("search.searchFailed");
    return;
  }

  if (!data) {
    results.value = [];
    searchError.value = t("search.searchFailed");
    return;
  }

  const list: SearchResult[] = [];
  const pushItems = (items: SearchItem[], kind: Kind, base: string) => {
    for (const i of items) {
      list.push({
        kind,
        id: i.id,
        title: i.title,
        link: `${base}/${i.id}`,
      });
    }
  };

  pushItems(data.categories, "category", "/categories");
  pushItems(data.folders, "folder", "/folders");
  pushItems(data.files, "file", "/files");

  // Handle attachments separately - use file_id for navigation
  for (const attachment of data.attachments) {
    // Only include attachments with a valid file_id
    if (attachment.file_id !== null) {
      list.push({
        kind: "attachment",
        id: attachment.id,
        title: attachment.title,
        link: `/files/${attachment.file_id}`,
      });
    }
  }

  results.value = list;
  open.value = true; // Always show the panel to display "no results" message
}

// Watch input
watch(q, (val) => {
  if (!val.trim()) {
    open.value = false;
    searchedQ.value = "";
    results.value = [];
    searchError.value = null;
    hasSearched.value = false;
  }
});

// Close on outside click
function onDocClick(e: MouseEvent) {
  const t = e.target as Node;
  const targets = [toDom(desktopInputEl.value), toDom(desktopPanelEl.value), toDom(mobileInputEl.value), toDom(mobilePanelEl.value)].filter(Boolean) as HTMLElement[];
  const clickedInside = targets.some((el) => el.contains(t));
  if (!clickedInside) open.value = false;
}
onMounted(() => document.addEventListener("click", onDocClick, { capture: true }));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick, { capture: true }));

// Clear all search state
function clearSearch() {
  q.value = "";
  searchedQ.value = "";
  open.value = false;
  results.value = [];
  activeIndex.value = -1;
  searchError.value = null;
  hasSearched.value = false;
  showMobileSearch.value = false;
  blurEl(desktopInputEl.value);
  blurEl(mobileInputEl.value);
}

// Icon selector
function iconFor(kind: Kind) {
  switch (kind) {
    case "category":
      return Tag;
    case "folder":
      return Folder;
    case "file":
      return File;
    default:
      return FileText;
  }
}

// Keyboard nav
function move(delta: number) {
  const len = results.value.length;
  if (!len) {
    activeIndex.value = -1;
    return;
  }
  activeIndex.value = (activeIndex.value + delta + len) % len;
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" && open.value) {
    e.preventDefault();
    move(1);
    return;
  }
  if (e.key === "ArrowUp" && open.value) {
    e.preventDefault();
    move(-1);
    return;
  }
  if (e.key === "Escape") {
    open.value = false;
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    doSearch();
  }
}

// Lock body scroll for mobile
watch(showMobileSearch, (v) => {
  const root = document.documentElement;
  if (v) {
    root.style.overflow = "hidden";
    root.style.position = "relative";
  } else {
    root.style.overflow = "";
    root.style.position = "";
  }
});
</script>

<template>
  <!-- Desktop -->
  <div class="hidden md:block w-full md:!w-[420px]">
    <div class="relative flex-1" :dir="$i18n && $i18n.locale === 'ar' ? 'rtl' : 'ltr'">
      <Input
        ref="desktopInputEl"
        v-model="q"
        type="text"
        :placeholder="t('search.placeholder')"
        :class="['w-full h-10 rounded-md bg-white shadow-sm peer', $i18n && $i18n.locale === 'ar' ? 'pe-32 ps-10' : 'ps-10 pe-28']"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
        @keydown.enter.prevent="!isComposing && doSearch()"
        @focus="open = true"
        @keydown="onKeydown"
      />
      <span class="absolute top-1/2 -translate-y-1/2 text-gray-400" :class="[$i18n && $i18n.locale === 'ar' ? 'right-3' : 'left-3']">
        <Search class="h-5 w-5" />
      </span>
      <button
        :class="[
          'absolute top-1/2 -translate-y-1/2 px-3 h-8 bg-[#169CC2] hover:bg-[#1386a5] text-white rounded-md text-sm font-semibold transition-opacity opacity-0 peer-focus:opacity-100',
          $i18n && $i18n.locale === 'ar' ? 'left-2' : 'right-2',
        ]"
        @click="doSearch"
      >
        {{ t("search.searchButton") }}
      </button>
    </div>

    <!-- Dropdown -->
    <ClientOnly>
      <div
        v-if="open"
        ref="desktopPanelEl"
        class="absolute top-[calc(100%)] z-50 md:!w-[350px] lg:!w-[420px] xl:!w-[480px] 2xl:!w-[520px] border border-gray-200 rounded-lg shadow-md bg-white overflow-hidden"
      >
        <div v-if="loading" class="flex justify-center items-center py-6">
          <Loader2 class="h-5 w-5 text-gray-500 animate-spin" />
        </div>

        <div v-else-if="searchError" class="px-3 py-4 text-center">
          <div class="text-red-500 text-sm mb-2">{{ searchError }}</div>
          <button class="text-[#169CC2] text-sm hover:underline" @click="doSearch">{{ t("search.tryAgain") }}</button>
        </div>

        <ul v-else-if="results.length" class="max-h-72 overflow-auto">
          <li
            v-for="(item, i) in results"
            :key="item.id"
            class="flex items-center justify-between gap-2 px-3 py-2 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
            :class="i === activeIndex ? 'bg-gray-100' : ''"
            @mouseenter="activeIndex = i"
            @mouseleave="activeIndex = -1"
            @click.stop="
              clearSearch();
              router.push(localePath(item.link));
            "
          >
            <div class="flex items-center gap-2">
              <component :is="iconFor(item.kind)" class="w-4 h-4 text-[#169CC2]" />
              <span class="text-sm text-[#575757] truncate">{{ item.title }}</span>
            </div>
            <div class="text-[12px] text-[#A3A3A3]">
              {{ t(`search.${item.kind}`) }}
            </div>
          </li>
        </ul>

        <div v-else-if="hasSearched && !loading && !searchError" class="px-3 py-4 text-center">
          <div class="text-gray-500 text-sm mb-2">{{ t("search.noResults", { query: searchedQ }) }}</div>
          <div class="text-xs text-gray-400">{{ t("search.tryDifferent") }}</div>
        </div>
      </div>
    </ClientOnly>
  </div>

  <!-- Mobile -->
  <div class="md:hidden">
    <button
      class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      aria-label="Search"
      @click="
        showMobileSearch = !showMobileSearch;
        showMobileSearch ? nextTick(() => focusEl(mobileInputEl)) : clearSearch();
      "
    >
      <Search v-if="!showMobileSearch" class="h-6 w-6 text-gray-500" />
      <X v-else class="h-6 w-6 text-gray-500" />
    </button>
  </div>

  <ClientOnly>
    <teleport to="body">
      <div v-if="showMobileSearch" class="fixed inset-x-0 bottom-0 z-30 md:hidden bg-white border-t border-[#e5e5e5] shadow-lg" style="top: 64px">
        <div class="px-3 pt-3 pb-2 border-b border-[#e5e5e5]">
          <div class="relative flex-1">
            <Input
              ref="mobileInputEl"
              v-model="q"
              type="text"
              :placeholder="t('search.placeholder')"
              class="w-full h-10 rounded-md ps-10 pe-20 bg-white shadow-sm peer"
              @keydown="onKeydown"
            />
            <span class="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search class="h-5 w-5" />
            </span>
            <button
              class="absolute end-2 top-1/2 -translate-y-1/2 px-3 h-8 bg-[#169CC2] hover:bg-[#1386a5] text-white rounded-md text-sm font-semibold transition-opacity opacity-0 peer-focus:opacity-100"
              @click="doSearch"
            >
              {{ t("search.searchButton") }}
            </button>
          </div>
        </div>

        <div class="overflow-y-auto bg-white" style="max-height: calc(100vh - 64px - 72px)">
          <div v-if="loading" class="flex justify-center items-center py-6">
            <Loader2 class="h-5 w-5 text-gray-500 animate-spin" />
          </div>

          <div v-else-if="searchError" class="px-3 py-4 text-center">
            <div class="text-red-500 text-sm mb-2">{{ searchError }}</div>
            <button class="text-[#169CC2] text-sm hover:underline" @click="doSearch">{{ t("search.tryAgain") }}</button>
          </div>

          <ul v-else-if="open && results.length" ref="mobilePanelEl" class="max-h-[60vh] overflow-auto border border-[#e5e5e5] rounded-xl m-3">
            <li
              v-for="item in results"
              :key="item.id"
              class="flex items-center justify-between gap-2 px-3 py-2 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
              @click.stop="
                clearSearch();
                router.push(localePath(item.link));
              "
            >
              <div class="flex items-center gap-2">
                <component :is="iconFor(item.kind)" class="w-4 h-4 text-[#169CC2]" />
                <span class="text-sm text-[#575757] truncate">{{ item.title }}</span>
              </div>
              <div class="text-[12px] text-[#A3A3A3]">
                {{ item.kind.charAt(0).toUpperCase() + item.kind.slice(1) }}
              </div>
            </li>
          </ul>

          <div v-else-if="hasSearched && !loading && !searchError" class="px-3 py-4 text-center">
            <div class="text-gray-500 text-sm mb-2">No results found for "{{ searchedQ }}"</div>
            <div class="text-xs text-gray-400">Try different keywords or check your spelling</div>
          </div>
        </div>
      </div>
    </teleport>
  </ClientOnly>
</template>

<style scoped>
ul::-webkit-scrollbar {
  width: 8px;
}
ul::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 8px;
}
</style>
