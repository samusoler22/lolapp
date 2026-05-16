/**
 * Strips HTML tags from Data Dragon item/ability description strings.
 *
 * Data Dragon descriptions contain tags like:
 *   <br>, <br/>, <rules>, </rules>, <stats>, <li>, <attention>, <scaleAP>, etc.
 *
 * Uses the browser's DOMParser for safe stripping (no regex hacks, no XSS risk).
 * Block-level tags are replaced with newlines before stripping to preserve
 * visual separation.
 *
 * @param {string} html
 * @returns {string} clean plain text
 */
export function stripHtml(html) {
  if (!html) return ''

  const withNewlines = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(li|rules|stats|attention|p|div|h[1-6])(\s[^>]*)?>/gi, '\n')

  // DOMParser is available in all modern browsers
  const doc = new DOMParser().parseFromString(withNewlines, 'text/html')
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}
