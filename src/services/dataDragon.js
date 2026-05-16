const BASE = 'https://ddragon.leagueoflegends.com'

/**
 * Fetches the latest game patch version string.
 * @returns {Promise<string>} e.g. "16.4.1"
 */
export async function fetchLatestVersion() {
  const res = await fetch(`${BASE}/api/versions.json`)
  if (!res.ok) throw new Error('Could not fetch versions')
  const versions = await res.json()
  return versions[0]
}

/**
 * Fetches all champions (summary data — id, name, key, image, tags).
 * @param {string} version
 * @returns {Promise<Record<string, object>>} object keyed by champion id
 */
export async function fetchAllChampions(version) {
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/champion.json`)
  if (!res.ok) throw new Error('Could not fetch champions')
  const json = await res.json()
  return json.data
}

/**
 * Fetches full champion detail including spells (Q/W/E/R) and passive.
 * @param {string} version
 * @param {string} championId — e.g. "Jinx"
 * @returns {Promise<object>} champion detail object
 */
export async function fetchChampionDetail(version, championId) {
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/champion/${championId}.json`)
  if (!res.ok) throw new Error(`Could not fetch champion detail for ${championId}`)
  const json = await res.json()
  return json.data[championId]
}

/**
 * Fetches all items for building the item lookup index.
 * @param {string} version
 * @returns {Promise<Record<string, object>>} object keyed by numeric item id string
 */
export async function fetchAllItems(version) {
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/item.json`)
  if (!res.ok) throw new Error('Could not fetch items')
  const json = await res.json()
  return json.data
}

/* ─── URL constructors (pure, no fetch) ──────────────────────────────── */

export const getChampionIconUrl = (version, imageFullFilename) =>
  `${BASE}/cdn/${version}/img/champion/${imageFullFilename}`

export const getChampionSplashUrl = (championId) =>
  `${BASE}/cdn/img/champion/splash/${championId}_0.jpg`

// Loading screen art — 308×560px portrait, always shows champion prominently
export const getChampionLoadingUrl = (championId) =>
  `${BASE}/cdn/img/champion/loading/${championId}_0.jpg`

// Skin-specific URL constructors
export const getChampionSkinSplashUrl = (championId, skinNum) =>
  `${BASE}/cdn/img/champion/splash/${championId}_${skinNum}.jpg`

export const getChampionSkinLoadingUrl = (championId, skinNum) =>
  `${BASE}/cdn/img/champion/loading/${championId}_${skinNum}.jpg`

export const getChampionSkinTileUrl = (championId, skinNum) =>
  `${BASE}/cdn/img/champion/tiles/${championId}_${skinNum}.jpg`


export const getSpellIconUrl = (version, imageFullFilename) =>
  `${BASE}/cdn/${version}/img/spell/${imageFullFilename}`

export const getPassiveIconUrl = (version, imageFullFilename) =>
  `${BASE}/cdn/${version}/img/passive/${imageFullFilename}`

export const getItemIconUrl = (version, itemId) =>
  `${BASE}/cdn/${version}/img/item/${itemId}.png`

/* ─── Community Dragon — chroma colors ───────────────────────────────── */

const chromaCache = new Map()

/**
 * Fetches chroma color data from Community Dragon for a champion.
 * Returns a Map of skinNum → chroma objects (each with .colors[] and .name).
 *
 * @param {string} championKey — numeric key string e.g. "266"
 * @returns {Promise<Map<number, object[]>>}
 */
export async function fetchChromaData(championKey) {
  if (chromaCache.has(championKey)) return chromaCache.get(championKey)

  const numKey = parseInt(championKey)
  const res = await fetch(
    `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${numKey}.json`
  )
  if (!res.ok) throw new Error(`Chroma fetch failed for key ${championKey}`)
  const json = await res.json()

  const skinChromas = new Map()
  for (const skin of json.skins ?? []) {
    const skinNum = skin.id - numKey * 1000
    if (skin.chromas?.length > 0) {
      skinChromas.set(skinNum, skin.chromas)
    }
  }

  chromaCache.set(championKey, skinChromas)
  return skinChromas
}
