import type { RoleApiResponse } from "~~/types/role";

export const useFetchRoles = (options?: { page?: number; pageCount?: number; search?: string; immediate?: boolean }) => {
  const api = useApi();

  const page = ref(options?.page || 1);
  const pageCount = ref(options?.pageCount || 10);
  const search = ref(options?.search || "");

  const queryParams = computed(() => {
    const params = new URLSearchParams();
    params.append("page", page.value.toString());
    params.append("page_count", pageCount.value.toString());
    if (search.value) {
      params.append("search", search.value);
    }
    return params.toString();
  });

  const { data, pending, error, refresh } = useAsyncData<RoleApiResponse>(
    () => `roles-${page.value}-${pageCount.value}-${search.value}`,
    () => api(`/roles?${queryParams.value}`),
    {
      server: true,
      immediate: options?.immediate !== false,
    }
  );

  const updatePage = (newPage: number) => {
    page.value = newPage;
  };

  const updatePageCount = (newPageCount: number) => {
    pageCount.value = newPageCount;
    page.value = 1; // Reset to first page when changing page size
  };

  const updateSearch = (newSearch: string) => {
    search.value = newSearch;
    page.value = 1; // Reset to first page when searching
  };

  // Global refetch function that can be called from anywhere
  const refetchRoles = async () => {
    refresh();
  };

  return {
    data,
    pending,
    error,
    refresh,
    refetchRoles,
    page: readonly(page),
    pageCount: readonly(pageCount),
    search: readonly(search),
    updatePage,
    updatePageCount,
    updateSearch,
  };
};
