<script setup>
import AvatarDropDown from "./AvatarDropDown.vue";
import LangSwitcher from "./LangSwitcher.vue";
import SearchInput from "./SearchInput.vue";
</script>

<template>
  <header class="fixed top-0 start-0 z-40 !px-5 w-screen h-16 border-b border-[#e5e5e5] bg-white" role="banner">
    <div class="h-full flex items-center justify-between gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4">
      <!-- Left: logo + sidebar trigger -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <SidebarTrigger class="lg:hidden" aria-label="Open sidebar" />
        <NuxtLinkLocale to="/" class="inline-flex items-center" aria-label="Go home">
          <!-- Desktop logo -->
          <img src="/kandil-logo.png" class="block h-11 w-auto object-contain" alt="Company logo" />
        </NuxtLinkLocale>
      </div>

      <!-- Right: actions (search icon on sm, input on md+) -->
      <nav aria-label="User actions" class="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 [&>*]:inline-flex [&>*]:items-center">
        <!-- Make search the flexible one -->
        <div class="flex-1 min-w-0 lg:w-[420px] xl:w-[480px] 2xl:w-[520px]">
          <SearchInput />
        </div>

        <!-- Outlook link: pin size & prevent flex-shrink-use regular anchor for protocol handler -->
        <a
          href="ms-outlook:"
          class="inline-flex h-12 w-12 min-h-[3rem] min-w-[3rem] items-center justify-center rounded-full hover:bg-gray-50 transition-colors shrink-0 flex-none"
          aria-label="Open Outlook"
          title="Open Outlook"
        >
          <img src="/outlook-icon.png" alt="Outlook" class="h-8 w-8 min-h-[2rem] min-w-[2rem] object-contain shrink-0 select-none pointer-events-none" />
        </a>

        <div class="inline-flex shrink-0">
          <AvatarDropDown />
        </div>

        <div class="inline-flex shrink-0">
          <LangSwitcher />
        </div>
      </nav>
    </div>
  </header>
</template>
