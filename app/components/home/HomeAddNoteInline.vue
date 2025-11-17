<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

// Inline type definition for ApiNote
interface ApiNote {
  id: number;
  description: string;
  createdAt: string;
}

// Emit type corrected
const emit = defineEmits<{ (e: "add-note", p: Pick<ApiNote, "description">): void; (e: "cancel"): void }>();

const { t } = useI18n();

const newDescription = ref("");
const error = ref("");
const formRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (formRef.value && !formRef.value.contains(e.target as Node)) emit("cancel");
  };
  document.addEventListener("mousedown", handleClickOutside);
  onBeforeUnmount(() => document.removeEventListener("mousedown", handleClickOutside));
});

function saveNote() {
  if (!newDescription.value.trim()) {
    error.value = t("home.notes.fieldRequired");
    return;
  }
  emit("add-note", { description: newDescription.value.trim() });
  newDescription.value = "";
  error.value = "";
}

const vFocus = {
  mounted(el: HTMLElement) {
    el.focus();
  },
};

watch(newDescription, (val) => {
  if (val && val.trim()) error.value = "";
});
</script>

<template>
  <div ref="formRef" class="mt-4 p-4 rounded-xl bg-[#F3FCFF] border-2 border-dashed border-[#B2CBD3] shadow-[0_0.5px_2px_rgba(0,0,0,0.05)] transition-all">
    <div class="space-y-2">
      <Textarea v-model="newDescription" v-focus :placeholder="t('home.notes.placeholder')" rows="5" :class="{ 'border-red-500': error }" />
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    </div>

    <div class="mt-4 flex justify-end">
      <Button
        class="rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-lg cursor-pointer h-8 w-auto px-3 py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md font-medium text-sm"
        @click="saveNote"
      >
        {{ t("home.notes.save") }}
      </Button>
    </div>
  </div>
</template>
