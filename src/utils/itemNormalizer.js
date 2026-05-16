/**
 * Known alias overrides for items that have name differences between
 * Leaguepedia and Data Dragon (renames, regional variants, abbreviations).
 */
const ALIASES = new Map([
  ['deathcap',                'rabadons deathcap'],
  ['zhonyas',                 'zhonyas hourglass'],
  ['malmortius',              'maw of malmortius'],
  ['deaths dance',            'deaths dance'],
  ['trinity',                 'trinity force'],
  ['ludens companion',        'ludens companion'],
  ['ludens tempest',          'ludens tempest'],
])

/**
 * Normalizes an item name string for consistent matching.
 *
 * Strategy: lowercase → strip apostrophes (straight & curly) →
 *           strip periods → strip other special chars → collapse spaces
 *
 * Examples:
 *   "Luden's Tempest"       → "ludens tempest"
 *   "Rabadon's Deathcap"    → "rabadons deathcap"
 *   "B.F. Sword"            → "bf sword"
 *   "Zhonya's Hourglass"    → "zhonyas hourglass"
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeItemName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/['']/g, '')        // curly/straight apostrophes
    .replace(/\./g, '')           // periods (B.F. Sword)
    .replace(/[^a-z0-9\s]/g, '') // remaining special chars
    .replace(/\s+/g, ' ')         // collapse whitespace
    .trim()
}

/**
 * Builds an optimized lookup index from normalized item name → item data.
 *
 * Call this ONCE when items are loaded, then pass the resulting Map
 * wherever item lookups are needed.
 *
 * @param {Record<string, object>} rawItemData
 *   The json.data object from Data Dragon item.json (keyed by numeric id string)
 * @returns {Map<string, { id: string, name: string, description: string, gold: object, image: object }>}
 */
export function buildItemIndex(rawItemData) {
  const index = new Map()

  for (const [id, item] of Object.entries(rawItemData)) {
    if (!item.name) continue

    const key = normalizeItemName(item.name)
    const entry = { id, ...item }

    index.set(key, entry)

    // Also resolve via alias map (both directions)
    const aliasTarget = ALIASES.get(key)
    if (aliasTarget) {
      index.set(aliasTarget, entry)
    }
  }

  return index
}

/**
 * Looks up an item by its raw Leaguepedia name string.
 *
 * @param {Map} itemIndex  — built by buildItemIndex()
 * @param {string} rawName — e.g. "Luden's Tempest"
 * @returns {{ id, name, description, gold, image } | null}
 */
export function lookupItem(itemIndex, rawName) {
  if (!rawName || !itemIndex) return null
  const key = normalizeItemName(rawName)
  if (itemIndex.has(key)) return itemIndex.get(key)

  // Try alias resolution
  const aliasKey = ALIASES.get(key)
  if (aliasKey && itemIndex.has(aliasKey)) return itemIndex.get(aliasKey)

  return null
}
