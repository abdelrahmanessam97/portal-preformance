<!-- app/components/global/DeleteItemDialog.vue -->
<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits(["update:open", "confirm"]);

const handleClose = () => {
  emit("update:open", false);
};

const handleConfirm = () => {
  emit("confirm");
};
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 rounded-2xl shadow-lg bg-white space-y-6 text-center">
      <!-- Header -->
      <DialogHeader class="space-y-3 text-center">
        <DialogTitle class="text-lg sm:text-xl font-semibold text-gray-900 text-center">
          {{ props.title || "Are you sure?" }}
        </DialogTitle>
        <DialogDescription class="text-sm text-gray-600 leading-relaxed text-center">
          {{ props.description || "This action cannot be undone. Please confirm to proceed." }}
        </DialogDescription>
      </DialogHeader>

      <!-- Footer -->
      <DialogFooter class="grid grid-cols-2 gap-3 w-full">
        <Button variant="default" class="w-full py-3 rounded-lg text-sm font-medium cursor-pointer" @click="handleConfirm">
          {{ props.confirmText || t("dialog.delete.confirm") }}
        </Button>
        <Button variant="outline" class="w-full py-3 rounded-lg text-sm font-medium" @click="handleClose">
          {{ props.cancelText || t("dialog.buttons.cancel") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
