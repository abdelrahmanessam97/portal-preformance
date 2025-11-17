<script setup>
import AvatarDropDown from "./AvatarDropDown.vue";
import LangSwitcher from "./LangSwitcher.vue";
import SearchInput from "./SearchInput.vue";
</script>

<template>
  <header class="fixed top-0 start-0 z-40 !px-5 w-screen h-16 border-b border-[#e5e5e5] bg-white" role="banner">
    <nav class="h-full flex items-center justify-between gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4" aria-label="Main navigation">
      <!-- Left: logo + sidebar trigger -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <SidebarTrigger class="lg:hidden h-11 w-11 sm:h-8 sm:w-8" :aria-label="t('navbar.openSidebar') || 'Open sidebar'" />
        <NuxtLinkLocale to="/" class="inline-flex items-center" :aria-label="t('navbar.goHome') || 'Go to home page'">
          <!-- Desktop logo -->
          <NuxtImg
            src="/kandil-logo.png"
            alt="Kandil Internal Portal logo"
            width="160"
            height="44"
            class="block h-11 w-auto object-contain"
            loading="eager"
            format="webp"
            quality="85"
          />
        </NuxtLinkLocale>
      </div>

      <!-- Right: actions (search icon on sm, input on md+) -->
      <div class="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 [&>*]:inline-flex [&>*]:items-center" role="toolbar" aria-label="User actions">
        <!-- Make search the flexible one -->
        <div class="flex-1 min-w-0 lg:w-[420px] xl:w-[480px] 2xl:w-[520px]">
          <SearchInput />
        </div>

        <!-- Outlook link: pin size & prevent flex-shrink-use regular anchor for protocol handler -->
        <a
          href="ms-outlook:"
          class="inline-flex h-11 w-11 sm:h-12 sm:w-12 min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-full hover:bg-gray-50 transition-colors shrink-0 flex-none"
          :aria-label="t('navbar.openOutlook') || 'Open Outlook email client'"
          :title="t('navbar.openOutlook') || 'Open Outlook'"
          rel="noopener noreferrer"
        >
          <NuxtImg
            src="/outlook-icon.png"
            alt=""
            width="32"
            height="32"
            class="h-8 w-8 min-h-[2rem] min-w-[2rem] object-contain shrink-0 select-none pointer-events-none"
            loading="lazy"
            format="webp"
            quality="85"
            aria-hidden="true"
          />
        </a>

        <div class="inline-flex shrink-0">
          <AvatarDropDown />
        </div>

        <div class="inline-flex shrink-0">
          <LangSwitcher />
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import AvatarDropDown from "./AvatarDropDown.vue";
import LangSwitcher from "./LangSwitcher.vue";
import SearchInput from "./SearchInput.vue";

const { t } = useI18n();
</script>
