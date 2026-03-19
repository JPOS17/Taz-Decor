/**
 * Sanitizes a string to be used as a Cloudinary folder name
 * 
 * Rules:
 * - Converts to lowercase
 * - Replaces & with "and"
 * - Removes invalid characters (keeps only alphanumeric, spaces, underscores, hyphens)
 * - Replaces spaces with underscores
 * - Removes multiple consecutive underscores
 * - Removes leading/trailing underscores
 */
export const sanitizeFolderName = (name: string): string => {
  if (!name || name.trim() === '') {
    return 'uncategorized';
  }

  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .trim() || 'uncategorized';
};