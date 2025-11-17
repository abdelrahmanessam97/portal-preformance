<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- app/components/home/HomeDateSection.vue -->
<script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/en";
import { CalendarPlus, Plus, X } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import Button from "../ui/button/Button.vue";
import Card from "../ui/card/Card.vue";
import HomeDateCalendar from "./HomeDateCalendar.vue";
import HomeDateNotesToBeMade from "./HomeDateNotesToBeMade.vue";

import { useRemindersFetch, type Task } from "@/composables/reminders/useRemindersFetch";
import { useRemindersPost } from "@/composables/reminders/useRemindersPost";
import { useChangeStatus } from "@/composables/settings/useChangeStatus";
import { useMultiDelete } from "@/composables/settings/useMultiDelete";

// Use i18n
const { locale, t } = useI18n();

const _selectedDate = ref(dayjs());
const accordionValue = ref<"reminders" | undefined>("reminders");

const { reminders, fetchReminders, pending } = useRemindersFetch();
const { createReminder } = useRemindersPost();

const isUpdating = ref<number | null>(null);
const isAdding = ref(false);
const isCreating = ref(false);

const selectedDate = computed({
  get: () => parseDate(_selectedDate.value.format("YYYY-MM-DD")),
  set: (newValue: DateValue) => {
    _selectedDate.value = dayjs(`${newValue.year}-${newValue.month}-${newValue.day}`);
  },
});

function dateKey(d: dayjs.Dayjs): string {
  return d.format("YYYY-MM-DD");
}

const currentKey = computed(() => dateKey(_selectedDate.value));
const currentReminders = computed<Task[]>(() => reminders.value?.[currentKey.value] ?? []);

const handleNewEdit = async ({ text }: { text: string }) => {
  const date = currentKey.value;
  isCreating.value = true;

  const res = await createReminder(date, text.trim());

  // Check if response indicates success (status_code 200-299)
  const statusCode = res.status_code ?? 200; // Default to success if no status_code
  const apiMessage = res.message || "Task added successfully";

  if (statusCode >= 200 && statusCode < 300) {
    toast.success(apiMessage);
    await fetchReminders();
    isAdding.value = false;
  } else {
    // Show error message directly from API
    toast.error(apiMessage);

    // Refresh notes and cancel adding on failure
    await fetchReminders();
    isAdding.value = false;
  }

  isCreating.value = false;
};

// ===== Toggle Done =====
const toggleDone = async (index: number) => {
  const target = currentReminders.value[index];
  if (!target?.id) {
    toast.error("Cannot update unsaved reminder.");
    return;
  }

  const newStatus = target.status === 1 ? 2 : 1;

  isUpdating.value = target.id;

  try {
    const { data, error } = await useChangeStatus({
      model_name: "Task",
      model_id: target.id,
      status: newStatus as 1 | 2,
    });

    if (error || !data || (data.status_code ?? 500) >= 400) throw new Error(data?.message || "Failed");

    // ✅ Update only local UI after success
    target.status = newStatus;

    toast.success(data.message || "Task status updated");
  } catch {
    toast.error("Failed to update task status");
  } finally {
    isUpdating.value = null;
  }
};

// ===== Delete Reminder =====
const deleteReminder = async (index: number) => {
  // Handle new reminder cancellation (index === -1)
  if (index === -1) {
    cancelAdd();
    return;
  }

  const toDelete = currentReminders.value[index];
  if (!toDelete?.id) return;

  isUpdating.value = toDelete.id;
  try {
    const { data, error } = await useMultiDelete({
      model_name: "Task",
      ids: [toDelete.id],
    });
    if (error || !data || (data.status_code ?? 500) >= 400) throw new Error("Failed to delete");
    await fetchReminders();
    toast.success(data.message || "Task deleted");
  } catch {
    toast.error("Failed to delete task");
  } finally {
    isUpdating.value = null;
  }
};
const addSource = ref<"top" | "empty" | null>(null);

const addReminder = (source: "top" | "empty") => {
  if (!pending.value && !isAdding.value) {
    addSource.value = source;
    isAdding.value = true;
  }
};

const cancelAdd = () => {
  isAdding.value = false;
  addSource.value = null;
  isCreating.value = false; // Also reset creating state
};

// Handle accordion state change
const handleAccordionChange = (value: any) => {
  // If accordion is closing (going to undefined/null/empty)
  if (!value || value === "") {
    _selectedDate.value = dayjs();
  }

  accordionValue.value = value;
};

// Handle accordion trigger click - reset date when closing
const handleAccordionToggle = () => {
  // If accordion is currently open, it will close, so reset date to today
  if (accordionValue.value === "reminders") {
    setTimeout(() => {
      _selectedDate.value = dayjs();
    }, 100);
  }
};

// Watch locale changes and update dayjs locale
watch(
  locale,
  (newLocale) => {
    dayjs.locale(newLocale === "ar" ? "ar" : "en");
  },
  { immediate: true }
);
</script>

<template>
  <Card class="w-full mt-4 sm:mt-12 p-2 sm:p-4 bg-white rounded-lg sm:rounded-2xl shadow-sm">
    <div class="p-2 sm:p-4">
      <ClientOnly>
        <Accordion type="single" collapsible :value="accordionValue" @update:value="handleAccordionChange">
          <AccordionItem value="reminders">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-baseline gap-2">
                <span class="text-[64px] font-[400] leading-none text-primary">
                  {{ _selectedDate.format("DD") }}
                </span>
                <span class="text-[24px] font-[400] text-primary">
                  {{ _selectedDate.format("MMMM YYYY") }}
                </span>
              </div>

              <AccordionTrigger
                class="cursor-pointer text-gray-600 flex items-center gap-1 hover:text-gray-800"
                :aria-expanded="accordionValue === 'reminders'"
                @click="handleAccordionToggle"
              >
                <span class="text-[16px] font-[700] text-gray-700"> {{ currentReminders.length }} {{ t("home.dateSection.reminders") }} </span>
              </AccordionTrigger>
            </div>

            <AccordionContent>
              <div class="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-6 mt-2 sm:mt-4 items-stretch">
                <div class="w-full lg:w-1/2 flex flex-col rounded-md relative">
                  <div v-if="pending" class="absolute inset-0 flex items-center justify-center bg-white/70">
                    <span class="animate-spin border-4 border-primary border-t-transparent rounded-full w-6 h-6" />
                  </div>

                  <div class="flex items-center justify-between p-2 sm:p-3 border-b bg-white rounded-t-md">
                    <h2 class="font-bold text-sm sm:text-xl lg:text-2xl text-gray-900">
                      {{ t("home.dateSection.reminders") }}
                    </h2>

                    <Button
                      v-if="!isAdding && currentReminders.length > 0"
                      type="button"
                      class="rounded-full text-white h-11 w-11 sm:h-8 sm:w-8 bg-primary hover:bg-primary/90"
                      size="icon"
                      :aria-label="t('home.dateSection.addReminder')"
                      :disabled="pending"
                      @click="addReminder('top')"
                    >
                      <Plus class="w-[16px] h-[16px]" aria-hidden="true" />
                    </Button>

                    <Button
                      v-else-if="isAdding"
                      type="button"
                      class="rounded-full text-white h-11 w-11 sm:h-9 sm:w-9 bg-[#706F6F] hover:bg-[#5a5959]"
                      size="icon"
                      :aria-label="t('home.dateSection.cancelAddReminder') || 'Cancel adding reminder'"
                      @mousedown.prevent="cancelAdd"
                    >
                      <X class="w-[18px] h-[18px]" aria-hidden="true" />
                    </Button>
                  </div>

                  <div class="flex-1 overflow-y-auto scroll-thin p-2 sm:p-3" style="max-height: 18.5rem">
                    <div class="flex flex-col gap-1 sm:gap-3">
                      <HomeDateNotesToBeMade
                        v-for="(reminder, i) in currentReminders"
                        :key="reminder.id ?? i"
                        :reminder="{
                          id: reminder.id,
                          text: reminder.description,
                          done: reminder.status === 1,
                        }"
                        :index="i"
                        :loading="isUpdating === reminder.id"
                        @toggle-done="toggleDone"
                        @delete="deleteReminder"
                      />

                      <HomeDateNotesToBeMade
                        v-if="isAdding"
                        :reminder="{ id: undefined, text: '', done: false }"
                        :index="-1"
                        :loading="isCreating"
                        @edit="handleNewEdit"
                        @delete="cancelAdd"
                      />

                      <div
                        v-if="currentReminders.length === 0 && !isAdding"
                        class="flex flex-col items-center justify-center py-6 sm:py-12 text-center text-gray-400 rounded-md px-2"
                      >
                        <CalendarPlus class="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                        <p class="text-base sm:text-lg font-medium">
                          {{ t("home.dateSection.noRemindersYet") }}
                        </p>
                        <!-- <p class="text-xs sm:text-sm text-gray-400 mt-1">
                          Start by adding your first task.
                        </p> -->
                        <Button
                          type="button"
                          class="mt-4 bg-primary text-white rounded-full h-11 px-6 sm:h-10 flex items-center justify-center gap-2"
                          :disabled="pending"
                          @click="addReminder('empty')"
                        >
                          <Plus class="w-4 h-4" aria-hidden="true" /> {{ t("home.dateSection.addReminder") }}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="w-full lg:w-1/2 flex">
                  <HomeDateCalendar v-model:date="selectedDate" class="flex-1 h-full" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ClientOnly>
    </div>
  </Card>
</template>

<style scoped>
.scroll-thin {
  scrollbar-width: thin;
  scrollbar-color: #7a7a7a4b #f1f1f1;
}

.scroll-thin::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

.scroll-thin::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.scroll-thin::-webkit-scrollbar-thumb {
  background: #7a7a7a4b;
  border-radius: 8px;
}

.scroll-thin::-webkit-scrollbar-thumb:hover {
  background: #7a7a7a4b;
}
</style>
