<script lang="ts" setup>
import type { HTMLAttributes } from "vue"
import { ChevronLeft, ChevronRight } from "lucide-vue-next"
import { cn } from "@/lib/utils"
const {locale} = useI18n();
const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    :class="cn('[&>svg]:size-3.5', props.class)"
  >
    <slot>

      <ChevronLeft v-if="locale === 'ar'" />
      <ChevronRight v-else />
    </slot>
  </li>
</template>
