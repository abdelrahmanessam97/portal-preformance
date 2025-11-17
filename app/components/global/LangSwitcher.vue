<!-- app/components/global/LangSwitcher.vue -->
<script setup>
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const availableLocales = computed(() => {
  return locales.value.filter((i) => i.code !== locale.value);
});
</script>

<template>
  <NuxtLink v-for="loc in availableLocales" :key="loc.code" :to="switchLocalePath(loc.code)">
    {{ loc.name }}
  </NuxtLink>
</template>
