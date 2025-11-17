<!-- app/components/home/HomeDateNotesToBeMade.vue -->
<script setup lang="ts">
import { Check, CircleCheck, Trash } from "lucide-vue-next";
import { nextTick, onMounted, ref, watch } from "vue";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const { t } = useI18n();

const props = defineProps<{
  reminder: { id?: number; text: string; done: boolean };
  index: number;
  loading?: boolean;
}>();
const emit = defineEmits<{
  "toggle-done": [index: number];
  delete: [index: number];
  edit: [data: { index: number; text: string }];
}>();

const isNew = ref(props.index === -1 || !props.reminder.text?.trim());
const draft = ref(props.reminder.text ?? "");
const errorMsg = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const isCancelling = ref(false);
const isSaving = ref(false);

const reminderSchema = z.string().trim().min(1, t("home.reminders.validation")).max(100);

const focusIfNew = async () => {
  if (isNew.value) {
    isCancelling.value = false; // Reset cancel flag when starting new reminder
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select?.();
  }
};

onMounted(focusIfNew);
watch(isNew, focusIfNew);
watch(
  () => props.reminder.text,
  (v) => {
    if (!isNew.value) draft.value = v ?? "";
  }
);

// Reset cancelling flag when user starts typing
watch(draft, () => {
  if (isCancelling.value) {
    isCancelling.value = false;
  }
});

const canSave = () => reminderSchema.safeParse(draft.value).success;

const saveNew = () => {
  // Set saving flag to prevent blur from canceling
  isSaving.value = true;

  // Prevent saving if already loading or cancelling
  if (props.loading || isCancelling.value) {
    isSaving.value = false;
    return;
  }

  const parsed = reminderSchema.safeParse(draft.value);
  if (!parsed.success) {
    errorMsg.value = parsed.error.issues[0]?.message ?? "Invalid reminder.";

    isSaving.value = false;
    return;
  }
  const val = parsed.data;

  emit("edit", { index: props.index, text: val });
  errorMsg.value = "";
};

const cancelNew = () => {
  isCancelling.value = true;
  errorMsg.value = "";
  emit("delete", props.index);
};

const onBlur = () => {
  // Don't cancel if we're in the process of saving or cancelling
  if (isCancelling.value || isSaving.value) {
    return;
  }

  // For new reminders, always cancel on blur - don't auto-save
  if (isNew.value) {
    cancelNew();
    return;
  }

  // Only auto-save for existing reminders being edited
  if (draft.value.trim()) {
    if (canSave()) {
      saveNew();
    } else {
      cancelNew();
    }
  } else {
    cancelNew();
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.preventDefault();
    isCancelling.value = true;
    cancelNew();
  }

  // Handle Enter key to save reminder
  if (e.key === "Enter") {
    e.preventDefault();

    // Only save if it's a new reminder and validation passes
    if (isNew.value && canSave() && !props.loading && !isSaving.value && !isCancelling.value) {
      saveNew();
    }
  }
};

const handleToggle = () => {
  if (props.index === -1) return;
  emit("toggle-done", props.index);
};

const handleDelete = () => {
  if (props.index === -1) {
    emit("delete", props.index);
    return;
  }
  if (!props.reminder.id) return;
  emit("delete", props.index);
};
</script>

<template>
  <div
    class="task-item group relative rounded-md p-2 sm:p-2.5 hover:shadow transition-all duration-300 min-h-8"
    :class="[reminder.done ? 'done' : '', isNew ? 'bg-[#f3fcff] border border-dashed' : 'bg-[#f3fcff] border']"
    :style="isNew ? { borderColor: '#B2CBD3' } : undefined"
  >
    <div class="flex items-center w-full gap-2">
      <div class="flex-1 px-1 flex items-center justify-center min-w-0 transition-all">
        <span v-if="!isNew" class="text-xs sm:text-sm truncate w-full text-center" :class="{ 'line-through text-gray-500': reminder.done }" :title="reminder.text">
          {{ reminder.text }}
        </span>

        <template v-else>
          <label for="reminder-input" class="sr-only">{{ t("home.reminders.placeholder") }}</label>
          <input
            id="reminder-input"
            ref="inputRef"
            v-model="draft"
            class="bg-transparent border-none outline-none focus:ring-2 focus:ring-primary text-center placeholder-gray-500 text-xs sm:text-sm flex-1 py-0.5"
            :placeholder="t('home.reminders.placeholder')"
            aria-label="New reminder title"
            :aria-invalid="!!errorMsg"
            :aria-describedby="errorMsg ? 'reminder-error' : undefined"
            maxlength="100"
            @keydown="onKeydown"
            @blur="onBlur"
          />
        </template>
      </div>

      <!-- Save button -->
      <button
        v-if="isNew"
        type="button"
        class="ms-1 inline-flex items-center justify-center h-11 w-11 sm:h-8 sm:w-8 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-200"
        :class="canSave() && !loading ? 'text-green-600 hover:bg-green-50' : 'text-green-600/50 cursor-not-allowed'"
        :disabled="!canSave() || loading"
        :aria-label="t('home.reminders.saveTitle')"
        @mousedown.prevent="canSave() && !loading && saveNew()"
      >
        <CircleCheck class="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
      </button>

      <!-- Actions -->
      <div
        v-else
        class="flex items-center justify-center gap-2 sm:gap-2.5 transition-all duration-300 w-0 opacity-0 overflow-hidden group-hover:w-20 group-hover:opacity-100"
      >
        <button
          type="button"
          class="h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-full text-green-600 hover:bg-green-50 transition-colors"
          :aria-label="t('home.reminders.doneTitle')"
          :aria-pressed="reminder.done"
          @click="handleToggle"
        >
          <Check class="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 transition-colors"
          :aria-label="t('home.reminders.deleteTitle')"
          @click="handleDelete"
        >
          <Trash class="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <template v-if="loading">
      <LoadingSpinner />
    </template>

    <Alert v-if="errorMsg" id="reminder-error" class="absolute left-0 top-full mt-1 w-60 border-red-200 bg-red-50 shadow-md rounded-md z-10 p-1.5" role="alert">
      <AlertTitle class="text-[11px] font-semibold text-red-700">{{ t("home.reminders.validationTitle") }}</AlertTitle>
      <AlertDescription class="text-[11px] text-red-600">
        {{ errorMsg }}
      </AlertDescription>
    </Alert>
  </div>
</template>

<style scoped>
.task-item.done span {
  text-decoration: line-through;
  color: #888;
}
</style>
