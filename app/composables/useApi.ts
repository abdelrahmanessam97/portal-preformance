// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>("token");
  const auth = useAuthStore();

  return $fetch.create({
    baseURL: config.public.apiBase as string,

    onRequest({ options }) {
      const localeCookie = useCookie<string>("i18n_redirected", {
        default: () => "en",
        watch: true,
      });
      const currentLocale = localeCookie.value || "en";

      // Use Headers to avoid `any` and keep types happy
      const headers = new Headers(options.headers as HeadersInit);
      headers.set("accept", "application/json");
      headers.set("Accept-Language", currentLocale);
      if (token.value) headers.set("Authorization", `Bearer ${token.value}`);
      options.headers = headers;
    },

    retry: 1,

    // accept the arg; underscore to silence "unused" rule
    onResponseError({ response }) {
      // keep minimal; add 401 handling later if you want
      if (response.status === 401) {
        // User is unauthenticated
        auth.clearSession();

        // Optional redirect
        const router = useRouter();
        router.push("/login");
      }
    },
  });
};
