const LOWERCASE_WORDS = ['of', 'in', 'on', 'the', 'and', 'a', 'an'];

// Formats a name string according to specific rules:
// - Always capitalize the first and last words
// - Lowercase certain conjunctions/prepositions unless they are the first or last word
// - Normalize whitespace and trim
export function formatName(input: string): string {
  if (!input || !input.trim()) {
    return '';
  }

  const normalized = input.trim().replace(/\s+/g, ' ');
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
    
    // Keep articles and prepositions lowercase in the middle of the string
    if (LOWERCASE_WORDS.includes(lowerWord)) {
      return lowerWord;
    }
    
    return capitalizeWord(word);
  });
  
  return formattedWords.join(' ');
}

// Capitalizes the first letter of a word and lowercases the rest
function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Returns true if the name is already in the expected formatted form
export function isNameFormatted(name: string): boolean {
  return name === formatName(name);
}