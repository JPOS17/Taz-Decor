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
    .toLowerCase()                           // Convert to lowercase
    .replace(/&/g, 'and')                    // Replace & with "and"
    .replace(/[^a-z0-9\s_-]/g, '')          // Remove special characters (keep letters, numbers, spaces, underscores, hyphens)
    .replace(/\s+/g, '_')                    // Replace spaces with underscores
    .replace(/_{2,}/g, '_')                  // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')                 // Remove leading/trailing underscores
    .trim() || 'uncategorized';              // Fallback if result is empty
};