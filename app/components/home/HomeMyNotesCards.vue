<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";
import LoadingSpinner from "../LoadingSpinner.vue";

// Define type for each note
interface ApiNote {
  id: number;
  description: string;
  createdAt: string;
}

// Define the props being passed from the parent component
defineProps<{
  notes: ApiNote[]; // Array of notes of type ApiNote
  error: unknown; // Error prop to handle errors
  loading: boolean; // Loading state while data is being fetched
}>();

const emit = defineEmits(["delete-note"]);

const { t } = useI18n();

// Function to handle delete action
const handleDelete = (id: number) => emit("delete-note", id);
</script>

<template>
  <!-- Display error message if there is an error -->
  <div v-if="error">
    {{ error || t("home.notes.failedToLoad") }}
  </div>

  <!-- Show loading state when data is being fetched -->
  <div v-else-if="loading">
    <LoadingSpinner />
  </div>

  <!-- Check if there are no notes and display an empty state -->
  <div v-else-if="!notes.length">{{ t("home.notes.noNotesAvailable") }}</div>

  <!-- Loop through notes and display them -->
  <div v-for="note in notes" v-else :key="note.id" class="my-4">
    <div class="group border p-4 rounded-2xl bg-[#EFF6F8] overflow-hidden">
      <div class="flex flex-col justify-between flex-1">
        <div>
          <p class="text-gray-900 text-sm leading-relaxed whitespace-pre-line">
            {{ note.description }}
          </p>
        </div>

        <!-- Delete button -->
        <div class="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            class="rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer h-11 w-11 sm:h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-xs sm:text-sm"
            :aria-label="`${t('home.notes.delete')} note`"
            @click="handleDelete(note.id)"
          >
            <Trash2 class="h-4 w-4" aria-hidden="true" />
            <span class="hidden sm:inline">{{ t("home.notes.delete") }}</span>
          </button>
        </div>
      </div>
    </div>
    <!-- Display created date -->
    <div class="text-xs text-gray-500 mt-2">
      <time :datetime="note.createdAt" class="font-medium">{{ note.createdAt }}</time>
    </div>
  </div>
</template>
