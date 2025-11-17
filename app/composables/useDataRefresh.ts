import { clearNuxtData } from "#app";

/**
 * Composable for managing data refresh and cache invalidation
 * Provides centralized data refresh strategies for CRUD operations
 */
export const useDataRefresh = () => {
  /**
   * Refresh all folder-related data
   * @param folderId - The folder ID to refresh data for
   */
  const refreshFolderData = async (folderId: number) => {
    await Promise.all([clearNuxtData(`files-by-folder-${folderId}`), clearNuxtData("categories"), clearNuxtData("folders")]);
  };

  /**
   * Refresh all file-related data
   * @param fileId - The file ID to refresh data for
   * @param folderId - Optional folder ID to refresh folder data
   */
  const refreshFileData = async (fileId: number, folderId?: number) => {
    const promises = [clearNuxtData(`file-${fileId}`)];

    if (folderId) {
      promises.push(clearNuxtData(`files-by-folder-${folderId}`));
    }

    await Promise.all(promises);
  };

  /**
   * Refresh all category-related data
   */
  const refreshCategoryData = async () => {
    await Promise.all([clearNuxtData("categories"), clearNuxtData("folders")]);
  };

  /**
   * Refresh all data (global refresh)
   */
  const refreshAllData = async () => {
    await Promise.all([clearNuxtData("categories"), clearNuxtData("folders"), clearNuxtData("files")]);
  };

  /**
   * Refresh data after file creation
   * @param folderId - The folder where the file was created
   */
  const refreshAfterFileCreate = async (folderId: number) => {
    await Promise.all([clearNuxtData(`files-by-folder-${folderId}`), clearNuxtData("categories")]);
  };

  /**
   * Refresh data after file update
   * @param fileId - The file that was updated
   * @param folderId - Optional folder ID
   */
  const refreshAfterFileUpdate = async (fileId: number, folderId?: number) => {
    const promises = [clearNuxtData(`file-${fileId}`)];

    if (folderId) {
      promises.push(clearNuxtData(`files-by-folder-${folderId}`));
    }

    await Promise.all(promises);
  };

  /**
   * Refresh data after file deletion
   * @param folderId - The folder where the file was deleted from
   */
  const refreshAfterFileDelete = async (folderId?: number) => {
    if (folderId) {
      await clearNuxtData(`files-by-folder-${folderId}`);
    }
  };

  /**
   * Refresh data after folder update
   * @param folderId - The folder that was updated
   */
  const refreshAfterFolderUpdate = async (folderId: number) => {
    await Promise.all([clearNuxtData(`files-by-folder-${folderId}`), clearNuxtData("categories")]);
  };

  /**
   * Refresh data after folder deletion
   */
  const refreshAfterFolderDelete = async () => {
    await clearNuxtData("categories");
  };

  /**
   * Refresh roles and admins data
   */
  const refreshRolesAndAdmins = async () => {
    // Clear the cache and let the component re-fetch when needed
    await clearNuxtData("/roles-to-categories");
  };

  return {
    refreshFolderData,
    refreshFileData,
    refreshCategoryData,
    refreshAllData,
    refreshAfterFileCreate,
    refreshAfterFileUpdate,
    refreshAfterFileDelete,
    refreshAfterFolderUpdate,
    refreshAfterFolderDelete,
    refreshRolesAndAdmins,
  };
};
