<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogScrollContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";
import { useDataRefresh } from "~/composables/useDataRefresh";
import { useActions } from "~/composables/roles/useActions";
import { useAdminSections } from "~/composables/roles/useAdminSections";
import { useRoleDetails } from "~/composables/roles/useRoleDetails";
import { useUpdateRole } from "~/composables/roles/useUpdateRole";
import LoadingSpinner from "../LoadingSpinner.vue";

const { t, locale } = useI18n();

interface Props {
  role: {
    id: string;
    name: string;
    permissions?: number;
    users?: number;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "role-updated"): void;
}>();

const isOpen = ref(false);
const isSubmitting = ref(false);

const { refreshRolesAndAdmins } = useDataRefresh();

const { data: sectionsData, pending: sectionsLoading, error: sectionsError } = await useAdminSections();
const { data: actionsData, pending: actionsLoading, error: actionsError } = await useActions();

// Role details will be fetched when dialog opens
const roleDetailsData = ref<unknown>(null);
const roleDetailsLoading = ref(false);
const roleDetailsError = ref<unknown>(null);

const sections = computed(() => (sectionsData.value as { data: Section[] })?.data || []);
const actions = computed(() => (actionsData.value as { data: Action[] })?.data || []);

interface Section {
  id: number;
  title: string;
  display_name: string;
}

interface Action {
  id: number;
  title: string;
  display_name: string;
}

const createFormSchema = () => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    name: z
      .string()
      .min(1, t("permissions.role.validation.nameRequired"))
      .min(3, t("permissions.role.validation.nameLength"))
      .max(50, t("permissions.role.validation.nameLength")),
  };

  sections.value.forEach((section: Section) => {
    actions.value.forEach((action: Action) => {
      const fieldName = `${section.title}_${action.title.toLowerCase()}`;
      schemaFields[fieldName] = z.boolean().default(false);
    });
  });

  return z.object(schemaFields);
};

const { handleSubmit, values, setFieldValue } = useForm({
  validationSchema: computed(() => toTypedSchema(createFormSchema())),
});

const getFieldValue = (fieldName: string) => values[fieldName] || false;

watch(isOpen, async (newValue) => {
  if (newValue) {
    // Fetch role details when dialog opens
    await fetchRoleDetails();

    // Initialize form data after role details are loaded
    if (sections.value.length > 0 && actions.value.length > 0) {
      initializeFormData();
    }
  }
});

watch([sections, actions], () => {
  if (isOpen.value && sections.value.length > 0 && actions.value.length > 0) {
    initializeFormData();
  }
});

// Fetch role details when dialog opens
const fetchRoleDetails = async () => {
  try {
    roleDetailsLoading.value = true;
    roleDetailsError.value = null;

    const roleId = parseInt(props.role.id.replace("#", ""));
    const { data, error, refresh } = await useRoleDetails(roleId);

    // Trigger the fetch
    await refresh();

    if (error.value) {
      roleDetailsError.value = error.value;
      toast.error(error.value?.message || "Error fetching role details");
    } else {
      roleDetailsData.value = data.value;
    }
  } catch (err: unknown) {
    const errorMessage = err as { message?: string } | null;
    roleDetailsError.value = err;
    toast.error(errorMessage?.message || "Error fetching role details");
  } finally {
    roleDetailsLoading.value = false;
  }
};

const initializeFormData = () => {
  // Use role details data if available, otherwise fallback to props
  const roleData = roleDetailsData.value ? (roleDetailsData.value as { data?: { name?: string; permissions?: unknown[] } })?.data : null;
  const finalRoleData = roleData || props.role;
  setFieldValue("name", finalRoleData.name || props.role.name);

  // Initialize all permissions to false first
  sections.value.forEach((section: Section) => {
    actions.value.forEach((action: Action) => {
      const fieldName = `${section.title}_${action.title.toLowerCase()}`;
      setFieldValue(fieldName, false);
    });
  });

  // Set permissions from role details if available
  if (finalRoleData.permissions && Array.isArray(finalRoleData.permissions)) {
    finalRoleData.permissions.forEach((permission: unknown) => {
      const perm = permission as { title?: string; id?: number };
      const fieldName = perm.title ? perm.title.replace("-", "_") : String(perm.id || "").replace("-", "_");
      setFieldValue(fieldName, true);
    });
  }
};

const isAllSelected = computed(() => {
  const permissionFields = Object.keys(values).filter((key) => key !== "name");
  return permissionFields.length > 0 && permissionFields.every((field) => values[field as keyof typeof values]);
});

const toggleSelectAll = (checked: boolean) => {
  sections.value.forEach((section: Section) => {
    actions.value.forEach((action: Action) => {
      const fieldName = `${section.title}_${action.title.toLowerCase()}`;
      setFieldValue(fieldName, checked);
    });
  });
};

const getSelectedPermissions = (formValues: Record<string, unknown>) => {
  const selectedPermissions: string[] = [];

  Object.entries(formValues).forEach(([key, value]) => {
    if (key !== "name" && value === true) {
      const permission = key.replace("_", "-");
      selectedPermissions.push(permission);
    }
  });

  return selectedPermissions;
};

const onSubmit = handleSubmit(async (formValues) => {
  const selectedPermissions = getSelectedPermissions(formValues);

  // Check if at least one permission is selected
  if (selectedPermissions.length === 0) {
    toast.error(t("permissions.role.validation.selectPermission"));
    return;
  }

  try {
    isSubmitting.value = true;

    const roleData = {
      name: formValues.name.trim(),
      permissions: selectedPermissions,
    };

    const { data, error } = await useUpdateRole(parseInt(props.role.id.replace("#", "")), roleData);

    if (error) {
      const errorObj = error as { message?: string };

      // Handle specific error cases
      if (
        errorObj.message?.toLowerCase().includes("already exists") ||
        errorObj.message?.toLowerCase().includes("duplicate") ||
        errorObj.message?.toLowerCase().includes("unique")
      ) {
        toast.error(t("permissions.role.toast.nameExists"));
      } else {
        toast.error(errorObj.message || t("permissions.role.toast.updateFailed"));
      }
      return;
    }

    if ((data as { status_code: number })?.status_code === 200) {
      toast.success(t("permissions.role.toast.updatedSuccess"));
      await refreshRolesAndAdmins();
      emit("role-updated");
      handleCancel();
    } else {
      toast.error(t("permissions.role.toast.updateFailed"));
    }
  } catch (error: unknown) {
    const errorMessage = error as { message?: string } | null;

    // Handle specific error cases
    if (
      errorMessage?.message?.toLowerCase().includes("already exists") ||
      errorMessage?.message?.toLowerCase().includes("duplicate") ||
      errorMessage?.message?.toLowerCase().includes("unique")
    ) {
      toast.error(t("permissions.role.toast.nameExists"));
    } else {
      toast.error(errorMessage?.message || t("permissions.role.toast.unexpectedError"));
    }
  } finally {
    isSubmitting.value = false;
  }
});

const handleCancel = () => {
  isOpen.value = false;
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogScrollContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle :class="['text-lg', 'pt-5', 'font-medium', locale === 'ar' ? 'text-right' : 'text-left']" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
          {{ t("permissions.role.editTitle") }}
        </DialogTitle>
      </DialogHeader>

      <form class="space-y-6" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel
              >{{ t("permissions.role.roleName") }} <span class="text-red-500 text-xs">{{ t("permissions.required") }}</span></FormLabel
            >
            <FormControl>
              <Input :placeholder="t('permissions.role.enterRoleName')" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              {{ t("permissions.role.permissions") }} <span class="text-red-500 text-xs">{{ t("permissions.required") }}</span>
            </div>
          </div>

          <!-- Permissions validation error -->
          <div v-if="getSelectedPermissions(values).length === 0" class="text-red-500 text-sm">{{ t("permissions.role.validation.selectPermission") }}</div>

          <div v-if="sectionsLoading || actionsLoading || roleDetailsLoading" class="text-center py-4">
            <LoadingSpinner />
          </div>

          <div v-else-if="sectionsError || actionsError || roleDetailsError" class="text-center py-4">
            <p class="text-red-500">{{ t("permissions.role.loadPermissionsFailed") }}</p>
          </div>

          <div v-else class="space-y-4 max-h-[380px] overflow-y-auto">
            <div v-for="section in sections" :key="section.id" class="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 class="font-medium text-gray-900 capitalize">
                {{ section.display_name }}
              </h4>
              <div class="grid grid-cols-4 gap-4">
                <FormField v-for="action in actions" :key="`${section.title}_${action.title.toLowerCase()}`" :name="`${section.title}_${action.title.toLowerCase()}`">
                  <FormItem class="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 cursor-pointer accent-black focus:ring-black"
                        :checked="getFieldValue(`${section.title}_${action.title.toLowerCase()}`)"
                        @change="(e) =>
                          setFieldValue(
                            `${section.title}_${action.title.toLowerCase()}`,
                            (e.target as HTMLInputElement)?.checked || false
                          )"
                      />
                    </FormControl>
                    <FormLabel class="text-sm !mt-0 capitalize cursor-pointer"> {{ action.display_name }} </FormLabel>
                  </FormItem>
                </FormField>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input
                id="select-all"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black cursor-pointer"
                :checked="isAllSelected"
                @change="(e) =>
                  toggleSelectAll((e.target as HTMLInputElement)?.checked || false)"
              />
              <Label for="select-all" class="text-sm font-medium cursor-pointer">{{ t("permissions.role.selectAll") }}</Label>
            </div>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <Button type="button" class="flex-1" variant="outline" @click="handleCancel"> {{ t("permissions.role.cancel") }} </Button>
          <Button type="submit" :disabled="isSubmitting" class="flex-1">
            <span v-if="isSubmitting">{{ t("permissions.role.updating") }}</span>
            <span v-else>{{ t("permissions.role.save") }}</span>
          </Button>
        </div>
      </form>
    </DialogScrollContent>
  </Dialog>
</template>
