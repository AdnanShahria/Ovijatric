export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, '-') // Replace spaces and zero-width spaces with -
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’+]/g, '') // Remove punctuation and symbols
    .replace(/\-\-+/g, '-')       // Replace multiple dashes with a single dash
    .replace(/^-+/, '')           // Trim leading dashes
    .replace(/-+$/, '');          // Trim trailing dashes
}
