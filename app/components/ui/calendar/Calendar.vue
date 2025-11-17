<script lang="ts" setup>
import { cn } from "@/lib/utils";
import { reactiveOmit } from "@vueuse/core";
import type { CalendarRootEmits, CalendarRootProps } from "reka-ui";
import { CalendarRoot, useForwardPropsEmits } from "reka-ui";
import type { HTMLAttributes } from "vue";
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from ".";

const props = defineProps<CalendarRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<CalendarRootEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CalendarRoot v-slot="{ grid, weekDays }" data-slot="calendar" :class="cn('p-3 rounded-lg bg-[#f3fcff] text-[#202224]', props.class)" v-bind="forwarded">
    <CalendarHeader class="flex items-center justify-between">
      <!-- Bold title -->
      <CalendarHeading class="font-bold text-lg mx-auto" />

      <!-- Prev & Next buttons side by side -->
      <div class="flex items-center gap-2">
        <CalendarPrevButton class="px-2 py-1 rounded-md bg-white text-primary hover:bg-white/90 hover:text-primary" />
        <CalendarNextButton class="px-2 py-1 rounded-md bg-white text-primary hover:bg-white/90 hover:text-primary" />
      </div>
    </CalendarHeader>

    <!-- Body wrapper -->
    <div class="flex justify-center mt-4 flex-grow w-full sm:gap-x-4 sm:flex-row">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="flex-1 max-w-full">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell v-for="day in weekDays" :key="day" class="flex-1 font-semibold text-[#202224] flex justify-center items-center text-center">
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>

        <CalendarGridBody>
          <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="mt-2 w-full">
            <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate" class="flex-1">
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="w-full flex justify-center items-center rounded-md px-2 py-1 text-[#202224] text-center data-[selected]:bg-primary data-[selected]:text-white"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
