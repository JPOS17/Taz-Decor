/**
 * List of words that should remain lowercase in formatted names
 */
const LOWERCASE_WORDS = ['of', 'in', 'on', 'the', 'and', 'a', 'an'];

/**
 * Formats a name with proper capitalization rules:
 * - Capitalizes the first letter of each word
 * - Keeps certain words lowercase (of, in, on, the, and, a, an)
 * - Always capitalizes the first and last words regardless
 * 
 * Works for both category names and product names.
 */
export function formatName(input: string): string {
  if (!input || !input.trim()) {
    return '';
  }

  // Trim and normalize whitespace
  const normalized = input.trim().replace(/\s+/g, ' ');
  
  // Split into words
  const words = normalized.split(' ');
  
  // Format each word
  const formattedWords = words.map((word, index) => {
    const isFirstWord = index === 0;
    const isLastWord = index === words.length - 1;
    const lowerWord = word.toLowerCase();
    
    // Always capitalize first and last words
    if (isFirstWord || isLastWord) {
      return capitalizeWord(word);
    }
    
    // Check if word should remain lowercase
    if (LOWERCASE_WORDS.includes(lowerWord)) {
      return lowerWord;
    }
    
    // Capitalize all other words
    return capitalizeWord(word);
  });
  
  return formattedWords.join(' ');
}

/**
 * Capitalizes the first letter of a word and lowercases the rest
 */
function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Validates if a name is properly formatted
 * Returns true if the name matches the expected format
 */
export function isNameFormatted(name: string): boolean {
  return name === formatName(name);
}