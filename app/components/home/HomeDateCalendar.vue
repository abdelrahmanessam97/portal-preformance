<!-- /app/components/home/HomeDateCalendar.vue -->
<script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import Calendar from "../ui/calendar/Calendar.vue";

const props = defineProps<{ date?: DateValue }>();
const emit = defineEmits<{ (e: "update:date", v: DateValue | undefined): void }>();

const { locale } = useI18n();
</script>

<template>
  <div class="flex items-center justify-center w-full flex-1 px-2 sm:px-3 md:px-4" role="application" aria-label="Date picker calendar">
    <Calendar
      :model-value="props.date"
      :locale="locale"
      class="w-full mx-auto max-w-sm sm:max-w-md md:max-w-lg rounded-lg border sm:border-0"
      aria-label="Select date"
      @update:model-value="emit('update:date', $event)"
    />
  </div>
</template>
