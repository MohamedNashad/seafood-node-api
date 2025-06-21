export function capitalizeFirstLetter(str: string): string {
  return str.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

export function convertToUpperCase(str: string): string {
  return str.toUpperCase();
}

export function convertToUnderscoreUpperCase(str: string): string {
  return str.toUpperCase().replace(/\W+/g, "_");
}

export function convertoLowerCase(str: string): string {
  return str.toLowerCase();
}

/**
 * Generates a URL-friendly slug from a given title string
 * @param title The input title to convert to a slug
 * @returns The generated slug string
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Invalid title input: must be a non-empty string');
  }

  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)/g, '');     // Remove leading/trailing hyphens
}
