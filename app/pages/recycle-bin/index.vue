<script setup lang="ts">
import ItemList from "@/components/recycle-bin/ItemList.vue";
import Tabs from "@/components/recycle-bin/Tabs.vue";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import LoadingSpinner from "~/components/LoadingSpinner.vue";
import { useFetchCategories } from "~/composables/categories/useFetchCategories";

import { useFetchCategory } from "~/composables/recycleBin/useFetchCategory";
import { useFetchDocument } from "~/composables/recycleBin/useFetchDocument";
import { useFetchFile } from "~/composables/recycleBin/useFetchFile";
import { useFetchFolder } from "~/composables/recycleBin/useFetchFolder";
import { useRestoreChild } from "~/composables/recycleBin/useRestoreChild";
import { useRestoreTree } from "~/composables/recycleBin/useRestoreTree";
import { usePermissions } from "~/composables/usePermissions";
import type { RecycleItem } from "~~/types/recycleBin";

type TabType = "categories" | "folders" | "files" | "documents";

const { locale, t } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();
const { refreshFetchCategories } = useFetchCategories();

const seoPageTitle = "Recycle Bin - Kandil Internal Portal";
const pageDescription = "View and restore deleted items from the recycle bin in Kandil Internal Portal.";
const siteUrl = config.public.apiBase?.replace("/api", "") || "";
const canonicalUrl = `${siteUrl}${route.path}`;

// Structured Data (JSON-LD) for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: seoPageTitle,
  description: pageDescription,
  url: canonicalUrl,
  isPartOf: {
    "@type": "WebSite",
    name: "Kandil Internal Portal",
    url: siteUrl,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Recycle Bin",
        item: canonicalUrl,
      },
    ],
  },
};

useHead({
  title: seoPageTitle,
  meta: [
    {
      name: "description",
      content: pageDescription,
    },
    {
      property: "og:title",
      content: seoPageTitle,
    },
    {
      property: "og:description",
      content: pageDescription,
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: canonicalUrl,
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
  link: [
    {
      rel: "canonical",
      href: canonicalUrl,
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(structuredData),
    },
  ],
  htmlAttrs: {
    lang: locale.value || "en",
  },
});

definePageMeta({
  middleware: "permission",
});
const { canUpdate } = usePermissions();

const activeTab = ref<TabType>("categories");
const searchQuery = ref("");

const titles: Record<TabType, string> = {
  categories: t("recycleBin.allCategories"),
  folders: t("recycleBin.allFolders"),
  files: t("recycleBin.allFiles"),
  documents: t("recycleBin.allDocuments"),
};

const recycleData = ref<Record<TabType, RecycleItem[]>>({
  categories: [],
  folders: [],
  files: [],
  documents: [],
});

const loading = ref(false);
const restoreLoadingCount = ref(0);

const { data: categoriesData, pending: catPending, refresh: refreshCategories } = useFetchCategory();
const { data: documentsData, pending: docPending, refresh: refreshDocuments } = useFetchDocument();
const { data: foldersData, pending: folderPending, refresh: refreshFolders } = useFetchFolder();
const { data: filesData, pending: filePending, refresh: refreshFiles } = useFetchFile();

watch([categoriesData, documentsData, foldersData, filesData], () => {
  if (categoriesData.value?.data) recycleData.value.categories = categoriesData.value.data;
  if (documentsData.value?.data) recycleData.value.documents = documentsData.value.data;
  if (foldersData.value?.data) recycleData.value.folders = foldersData.value.data;
  if (filesData.value?.data) recycleData.value.files = filesData.value.data;
});

const isLoading = computed(() => catPending.value || docPending.value || folderPending.value || filePending.value || loading.value || restoreLoadingCount.value > 0);

const list = computed(() => recycleData.value[activeTab.value]);
const pageTitle = computed(() => titles[activeTab.value]);

const toTreeModelName = (tab: TabType) => {
  if (tab === "folders") return "folder";
  if (tab === "files") return "file";
  return "attachment";
};

const handleRestore = async (id: string | number) => {
  restoreLoadingCount.value++;
  try {
    const modelId = Number(id);
    let res;

    // Use useRestoreTree only for categories
    if (activeTab.value === "categories") {
      res = await useRestoreTree("category", modelId);
      if (res.error) throw new Error((res.error as Error)?.message || t("recycleBin.toast.restoreCategoryFailed"));
      await refreshCategories();
      await refreshAll();
      await refreshFetchCategories();
    } else {
      // Use useRestoreChild for folders, files, and documents
      const modelName = toTreeModelName(activeTab.value);
      res = await useRestoreChild(modelName, modelId);
      if (res.error) throw new Error((res.error as Error)?.message || t("recycleBin.toast.restoreItemFailed"));
      await refreshTab(activeTab.value);
      await refreshAll();
      await refreshFetchCategories();
    }

    if (res.data?.message) {
      toast.success(res.data.message);
    } else {
      toast.success(`${activeTab.value.slice(0, -1)} ${t("recycleBin.toast.restored")}`);
    }
  } catch (err: unknown) {
    toast.error((err as Error)?.message || t("recycleBin.toast.restoreFailed"));
  } finally {
    restoreLoadingCount.value--;
  }
};

const refreshTab = async (tab: TabType) => {
  switch (tab) {
    case "categories":
      await refreshCategories();
      break;
    case "folders":
      await refreshFolders();
      break;
    case "files":
      await refreshFiles();
      break;
    case "documents":
      await refreshDocuments();
      break;
  }
};

const refreshAll = async () => {
  loading.value = true;
  try {
    await Promise.all([refreshCategories(), refreshFolders(), refreshFiles(), refreshDocuments()]);
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : t("recycleBin.toast.refreshFailed"));
  } finally {
    loading.value = false;
  }
};

// Fetch all data on mount
onMounted(async () => {
  await refreshAll();
});
</script>

<template>
  <section class="my-8 pb-16 min-h-screen mb-50">
    <h1 class="text-3xl font-bold mb-6">{{ t("recycleBin.title") }}</h1>

    <Tabs v-model:active="activeTab" class="mb-6" />

    <div v-if="isLoading">
      <LoadingSpinner />
    </div>

    <ItemList v-else :items="list" :type="activeTab" :title="pageTitle" :search-query="searchQuery" :can-restore="canUpdate('recycleBin')" @restore="handleRestore" />
  </section>
</template>
