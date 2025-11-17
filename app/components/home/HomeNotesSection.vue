<!-- app/components/home/HomeNotesSection.vue -->
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useCreateNote } from "@/composables/notes/useCreateNote";
import { useDeleteNote } from "@/composables/notes/useDeleteNote";
import { useFetchNotes } from "@/composables/notes/useFetchNotes";
import { Plus, X } from "lucide-vue-next";
import { onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import Separator from "../ui/separator/Separator.vue";
import AddNoteInline from "./HomeAddNoteInline.vue";
import HomeMyNotesCards from "./HomeMyNotesCards.vue";
import HomeNotesEmptyState from "./HomeNotesEmptyState.vue";

// Define the types inline
interface ApiNote {
  id: number;
  description: string;
  createdAt: string;
}

const { t } = useI18n();

// Fetching notes with proper typing and accessing data correctly
const { data: notesData, pending: notesPending, error: notesError, refresh: refetchNotes } = useFetchNotes();

// State for showing the add note form and holding notes data
const showAddNote = ref(false);
const notes = ref<ApiNote[]>([]); // Correctly typed notes array

// Function to sync local state with server data
const syncNotesWithServer = () => {
  try {
    if (notesData?.value?.data) {
      notes.value = notesData.value.data.map((note) => ({
        id: note.id,
        description: note.description,
        createdAt: note.created_at,
      }));
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to sync notes data.";
    toast.error(errorMessage);
  }
};

// Handle note fetching and data mapping
onMounted(async () => {
  syncNotesWithServer();
});

// Watch for changes in server data and sync local state
watch(
  notesData,
  () => {
    syncNotesWithServer();
  },
  { deep: true }
);

// Function to handle note creation
async function addNote(payload: { description: string }) {
  const description = payload.description?.trim();
  if (!description) return;

  // Client-side validation for description length
  if (description.length > 500) {
    toast.error(t("home.notes.validationMaxLength"));
    return;
  }

  try {
    const res = await useCreateNote(description);
    if (res.error || res.status >= 400) {
      // Display the specific API error message from backend
      toast.error(res.message || t("home.notes.createFailed"));
      return;
    }

    // Refresh data from server to ensure consistency
    await refetchNotes();
    // The watcher will automatically sync the local state

    toast.success(res.message || t("home.notes.createSuccess"));
    showAddNote.value = false;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : t("home.notes.createFailed");
    toast.error(errorMessage);
  }
}

// Delete note logic
async function deleteNote(noteId: number) {
  const snapshot = [...notes.value];
  notes.value = notes.value.filter((note) => note.id !== noteId);

  try {
    const res = await useDeleteNote(noteId);
    if (res.error) {
      notes.value = snapshot; // Revert on error
      toast.error(res.message || "Failed to delete note.");
      return;
    }

    // Refresh data from server to ensure consistency
    await refetchNotes();
    // The watcher will automatically sync the local state

    toast.success(res.message || "Deleted successfully.");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to delete note.";
    notes.value = snapshot;
    toast.error(errorMessage);
  }
}
</script>

<template>
  <section class="w-full mt-4 sm:mt-12 p-4 mb-50 rounded-xl bg-white">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-bold">{{ t("home.notes.title") }}</h2>

        <!-- Add / Cancel toggle button -->
        <Button
          v-if="!showAddNote"
          type="button"
          class="rounded-full text-white h-11 w-11 sm:h-[34px] sm:w-[34px] bg-primary hover:bg-primary/80 transition-colors duration-200 cursor-pointer"
          size="icon"
          :aria-label="t('home.notes.addNote') || 'Add note'"
          @click="showAddNote = true"
        >
          <Plus class="w-[18px] h-[18px]" aria-hidden="true" />
        </Button>

        <Button
          v-else
          type="button"
          class="rounded-full text-white h-11 w-11 sm:h-[34px] sm:w-[34px] bg-gray-500 hover:bg-red-500 transition-colors duration-200 cursor-pointer"
          size="icon"
          :aria-label="t('home.notes.cancelAddNote') || 'Cancel adding note'"
          @click="showAddNote = false"
        >
          <X class="w-[18px] h-[18px]" aria-hidden="true" />
        </Button>
      </div>

      <Separator class="my-5" />

      <!-- Inline form for adding notes -->
      <AddNoteInline v-if="showAddNote" @add-note="addNote" @cancel="showAddNote = false" />

      <!-- Show empty state if no notes exist -->
      <div v-if="notes.length === 0" class="p-6">
        <HomeNotesEmptyState />
      </div>

      <!-- Show notes if data is present -->
      <div v-else class="max-h-[600px] overflow-y-auto transition-all duration-300">
        <HomeMyNotesCards :notes="notes" :error="notesError" :loading="notesPending" @delete-note="deleteNote" />
      </div>
    </div>
  </section>
</template>
