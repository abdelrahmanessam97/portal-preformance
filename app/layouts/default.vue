<!-- /layouts/default.vue -->
<template>
  <SidebarProvider>
    <div class="flex flex-col w-full min-h-screen">
      <!-- Skip to main content link for accessibility -->
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <!-- Navbar (fixed, 4rem high) -->
      <Navbar class="fixed top-0 left-0 w-full z-50 h-16" />

      <!-- Body -->
      <div class="flex flex-1 pt-16 relative">
        <AppSidebar
          v-model:is-collapsed="isCollapsed"
          class="fixed z-20 transition-transform duration-300"
          :class="[sidebarPosition, isCollapsed ? sidebarCollapseTransform : 'translate-x-0']"
          style="top: 4rem; bottom: 0; min-height: calc(100vh - 4rem)"
        />

        <!-- Main content -->
        <main
          id="main-content"
          class="flex-1 px-6 py-6 overflow-x-hidden transition-all duration-300"
          :class="[isRtl ? 'lg:!pr-[calc(260px+1.5rem)]' : 'lg:!pl-[calc(260px+1.5rem)]']"
          :style="{
            [isRtl ? 'paddingRight' : 'paddingLeft']: isCollapsed ? '0' : undefined,
          }"
          tabindex="-1"
        >
          <slot />
        </main>
      </div>

      <!-- Footer -->
      <Footer class="w-full fixed bottom-0 left-0 right-0 z-40" />
    </div>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider } from "@/components/ui/sidebar";
import { computed, ref } from "vue";
import AppSidebar from "~/components/global/AppSidebar.vue";
import Footer from "~/components/global/Footer.vue";
import Navbar from "~/components/global/Navbar.vue";

const { locale } = useI18n();

const isCollapsed = ref(false);

// Computed properties for RTL support
const isRtl = computed(() => locale.value === "ar");

const sidebarPosition = computed(() => (isRtl.value ? "right-0" : "left-0"));
const sidebarCollapseTransform = computed(() => (isRtl.value ? `translate-x-[260px]` : "-translate-x-[260px]"));
</script>
