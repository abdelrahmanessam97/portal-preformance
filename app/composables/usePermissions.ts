// composables/usePermissions.ts
import { useAuthStore } from "~/stores/auth";
 
/**
 * Simplified Permission Composable
 *
 * This is just a lightweight wrapper around the auth store.
 * Use it to check permissions dynamically:
 *
 * @example
 * const { canRead, canCreate, canDelete } = usePermissions();
 *
 * if (canRead('products')) { ... }
 * if (canCreate('users')) { ... }
 * if (hasPermission('products-export')) { ... }
 */
export const usePermissions = () => {
    const authStore = useAuthStore();
 
    return {
        // Direct access to permission checking methods
        // These work with ANY resource dynamically - no need to predefine them!
        hasPermission: authStore.hasPermission,
        hasAnyPermission: authStore.hasAnyPermission,
        hasAllPermissions: authStore.hasAllPermissions,
        canCreate: authStore.canCreate,
        canRead: authStore.canRead,
        canUpdate: authStore.canUpdate,
        canDelete: authStore.canDelete,
        canManage: authStore.canManage,
        canSend: authStore.canSend,
        canExport: authStore.canExport,
    };
};