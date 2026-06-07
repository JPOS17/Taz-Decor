// Utility function to sanitize folder names for URL slugs or file paths
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