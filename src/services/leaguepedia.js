// Uses the MediaWiki Action API (api.php) with origin=* for browser CORS.
// This is Fandom's officially supported method for anonymous API access —
// no proxy needed, Cloudflare lets it through.
const API_BASE  = 'https://lol.fandom.com/api.php'
const CACHE_TTL = 10 * 60 * 1000  // 10 minutes

function getCached(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

function setCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/**
 * Fetches the last 25 pro player games on a given champion from Leaguepedia,
 * and attaches the opponent champion (same role, opposing team) to each match.
 *
 * @param {string} championName — must match Leaguepedia spelling exactly (e.g. "Aurelion Sol")
 * @returns {Promise<MatchData[]>}
 */
export async function fetchProMatches(championName) {
  const cacheKey = `proMatches_v1_${championName}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    action:   'cargoquery',
    tables:   'ScoreboardPlayers=SP,ScoreboardGames=SG',
    join_on:  'SG.GameId=SP.GameId',
    fields: [
      'SP.Link',
      'SP.Team',
      'SP.Champion',
      'SP.Role',
      'SP.Kills',
      'SP.Deaths',
      'SP.Assists',
      'SP.Items',
      'SP.GameId',
      'SG.DateTime_UTC',
      'SG.Tournament',
      'SG.Gamelength',
      'SG.Winner',
      'SG.Team1',
      'SG.Team2',
    ].join(','),
    where:    `SP.Champion='${championName.replace(/'/g, "''")}'`,
    order_by: 'SG.DateTime_UTC DESC',
    limit:    '25',
    format:   'json',
    origin:   '*',
  })

  const res = await fetch(`${API_BASE}?${params.toString()}`)
  if (!res.ok) throw new Error(`Leaguepedia HTTP ${res.status}`)

  const json = await res.json()
  if (json?.error?.code === 'ratelimited') {
    throw new Error('Leaguepedia rate limit reached — please wait a moment and try again.')
  }
  if (!Array.isArray(json?.cargoquery)) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(json).slice(0, 200)}`)
  }

  const rows    = json.cargoquery.map(e => e.title)
  const matches = rows.map(parseMatchRow)

  // Second pass: fetch the opponent champion in the same lane for each game
  const gameIds = [...new Set(rows.map(r => r['GameId']).filter(Boolean))]
  if (gameIds.length > 0) {
    await sleep(400)  // avoid back-to-back requests triggering rate limit
    const opponentMap = await fetchLaneOpponents(gameIds, rows)
    matches.forEach((match, i) => {
      const key = `${rows[i]['GameId']}__${rows[i]['Role']}__${rows[i]['Team']}`
      match.opponentChampion = opponentMap.get(key) ?? null
    })
  }

  setCache(cacheKey, matches)
  return matches
}

/**
 * Fetches all players in the given games and returns a map of
 * "gameId__role__team" → opponent champion name.
 */
async function fetchLaneOpponents(gameIds, originalRows) {
  const idList = gameIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')

  const params = new URLSearchParams({
    action:  'cargoquery',
    tables:  'ScoreboardPlayers=SP,ScoreboardGames=SG',
    join_on: 'SG.GameId=SP.GameId',
    fields:  'SP.GameId,SP.Champion,SP.Team,SP.Role',
    where:   `SP.GameId IN (${idList})`,
    limit:   String(gameIds.length * 12),  // up to 10 players per game + margin
    format:  'json',
    origin:  '*',
  })

  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`)
    if (!res.ok) return new Map()
    const json = await res.json()
    if (!Array.isArray(json?.cargoquery)) return new Map()

    const allPlayers = json.cargoquery.map(e => e.title)

    const result = new Map()
    for (const row of originalRows) {
      const gameId = row['GameId']
      const role   = row['Role']
      const team   = row['Team']
      if (!gameId || !role || !team) continue

      // Find the player in the same game+role from the opposing team
      const opponent = allPlayers.find(
        p => p['GameId'] === gameId && p['Role'] === role && p['Team'] !== team
      )
      if (opponent) {
        result.set(`${gameId}__${role}__${team}`, opponent['Champion'])
      }
    }

    return result
  } catch {
    return new Map()
  }
}

/**
 * Transforms an api.php cargoquery title object into a normalized MatchData shape.
 */
function parseMatchRow(row) {
  const playerTeam = row['Team']  || ''
  const team1      = row['Team1'] || ''
  const playerTeamSide = playerTeam === team1 ? 1 : 2

  const winnerRaw = row['Winner']
  const winnerNum =
    winnerRaw === null || winnerRaw === '' || winnerRaw === '0' || winnerRaw === 0
      ? 0
      : typeof winnerRaw === 'number' ? winnerRaw : parseInt(winnerRaw, 10)

  let result
  if (winnerNum === 0) {
    result = 'remake'
  } else if (winnerNum === playerTeamSide) {
    result = 'win'
  } else {
    result = 'loss'
  }

  const rawItems = row['Items']
  const items = Array.isArray(rawItems)
    ? rawItems.filter(Boolean)
    : String(rawItems || '').split(';').map(s => s.trim()).filter(Boolean)

  return {
    playerName:        row['Link']                                 || 'Unknown',
    team:              playerTeam,
    role:              row['Role']                                 || '',
    duration:          row['Gamelength']                          || '',
    kills:             parseInt(row['Kills'],   10)               || 0,
    deaths:            parseInt(row['Deaths'],  10)               || 0,
    assists:           parseInt(row['Assists'], 10)               || 0,
    items,
    date:              row['DateTime UTC'] || row['DateTime_UTC'] || '',
    tournament:        row['Tournament']                          || '',
    team1,
    team2:             row['Team2']                               || '',
    playerTeamSide,
    result,
    opponentChampion:  null,  // filled in by fetchLaneOpponents
  }
}
