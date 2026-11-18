import { useState, useEffect, useCallback } from 'react'
import { AppShell } from './components/AppShell'
import type { Tab } from './components/AppShell'
import type { Character, Rarity } from './components/RarityBadge'
import { RARITY_RANGES, RARITY_WEIGHTS } from './components/RarityBadge'
import { PacksTab } from './components/PacksTab'
import { ColecaoTab } from './components/ColecaoTab'
import { RankingTab } from './components/RankingTab'
import { PackOpeningScreen } from './components/PackOpeningScreen'
import { SummaryScreen } from './components/SummaryScreen'
import { AdminPanel } from './components/AdminPanel'
import { ThemeProvider } from './themes/ThemeContext'

const CACHE_KEY = 'anilist_500_characters'
const CACHE_DURATION = 24 * 60 * 60 * 1000
const TOTAL_PAGES = 10
const PER_PAGE = 50
const PAGE_DELAY = 300

const GRAPHQL_QUERY = `
  query GetTopCharacters($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) {
        id
        name {
          full
          native
        }
        image {
          large
          medium
        }
        media(sort: FAVOURITES_DESC) {
          nodes {
            title {
              romaji
              english
            }
            type
            isAdult
          }
        }
        favourites
      }
    }
  }
`

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': 'AnimePull/1.0 (https://github.com/anilist/anilist-api)',
        },
      })

      if (response.status === 429) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
          continue
        }
      }

      return response
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'User-Agent': 'AnimePull/1.0 (https://github.com/anilist/anilist-api)',
    },
  })
}

async function fetchPage(page: number): Promise<Character[]> {
  try {
    const response = await fetchWithRetry('/api/anilist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { page, perPage: PER_PAGE }
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
    }

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors.map((e: { message: string }) => e.message).join(', '))
    }

    return result.data?.Page?.characters || []
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('NetworkError')) {
      throw new Error('Erro de rede: Verifique sua conexão ou tente novamente. A API pode estar bloqueando CORS.')
    }
    throw err
  }
}

async function fetchAllCharacters(): Promise<Character[]> {
  const allCharacters: Character[] = []

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const characters = await fetchPage(page)
    allCharacters.push(...characters)

    if (page < TOTAL_PAGES) {
      await new Promise(resolve => setTimeout(resolve, PAGE_DELAY))
    }
  }

  return allCharacters
}

function filterAdultContent(characters: Character[]): Character[] {
  return characters.filter(char => {
    const hasAdultMedia = char.media.nodes.some(m => m.isAdult)
    return !hasAdultMedia
  })
}

function assignRarities(characters: Character[]): Character[] {
  const sorted = [...characters].sort((a, b) => b.favourites - a.favourites)

  return sorted.map((char, index) => {
    let rarity: Rarity = 'Comum'
    for (const [r, range] of Object.entries(RARITY_RANGES)) {
      if (index >= range.start && index <= range.end) {
        rarity = r as Rarity
        break
      }
    }
    return { ...char, rarity }
  })
}

function getCachedData(): { characters: Character[]; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed
      }
    }
  } catch {
  }
  return null
}

function setCacheData(characters: Character[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      characters,
      timestamp: Date.now()
    }))
  } catch {
  }
}

const COLLECTION_KEY = 'animepull_collection'

export function getCollection(): Character[] {
  try {
    const stored = localStorage.getItem(COLLECTION_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
  }
  return []
}

function addToCollection(cards: Character[]): void {
  try {
    const collection = getCollection()
    const existingIds = new Set(collection.map(c => c.id))
    const newCards = cards.filter(c => !existingIds.has(c.id))
    const updated = [...collection, ...newCards]
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(updated))
  } catch {
  }
}

export { addToCollection }

function rollRarity(): Rarity {
  const rand = Math.random() * 100
  let cumulative = 0

  const rarities: Rarity[] = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico']

  for (const rarity of rarities) {
    cumulative += RARITY_WEIGHTS[rarity]
    if (rand <= cumulative) {
      return rarity
    }
  }

  return 'Comum'
}

function drawCharacter(charactersByRarity: Record<Rarity, Character[]>): Character | null {
  const rarity = rollRarity()
  const pool = charactersByRarity[rarity]

  if (!pool || pool.length === 0) {
    const fallbackRarities: Rarity[] = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico']
    for (const r of fallbackRarities) {
      if (charactersByRarity[r]?.length) {
        const fallbackPool = charactersByRarity[r]
        return fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
      }
    }
    return null
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

function drawMultiple(charactersByRarity: Record<Rarity, Character[]>, count: number): Character[] {
  const results: Character[] = []
  for (let i = 0; i < count; i++) {
    const char = drawCharacter(charactersByRarity)
    if (char) results.push(char)
  }
  return results
}

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [charactersByRarity, setCharactersByRarity] = useState<Record<Rarity, Character[]>>({
    Comum: [], Incomum: [], Raro: [], Épico: [], Lendário: [], Mítico: []
  })
  const [showPack, setShowPack] = useState(false)
  const [packCards, setPackCards] = useState<Character[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [collection, setCollection] = useState<Character[]>(getCollection())
  const [activeTab, setActiveTab] = useState<Tab>('Packs')
  const [showAdmin, setShowAdmin] = useState(false)

  const getRarityStats = useCallback(() => {
    return Object.entries(charactersByRarity).map(([rarity, chars]) => ({
      rarity: rarity as Rarity,
      count: chars.length,
      weight: RARITY_WEIGHTS[rarity as Rarity]
    }))
  }, [charactersByRarity])

  const loadCharacters = useCallback(async () => {
    const cached = getCachedData()
    if (cached) {
      const withRarity = assignRarities(cached.characters)
      setCharacters(withRarity)

      const byRarity: Record<Rarity, Character[]> = {
        Comum: [], Incomum: [], Raro: [], Épico: [], Lendário: [], Mítico: []
      }
      withRarity.forEach(c => {
        if (c.rarity) byRarity[c.rarity].push(c)
      })
      setCharactersByRarity(byRarity)
      return
    }

    try {
      const data = await fetchAllCharacters()
      const filtered = filterAdultContent(data)
      const withRarity = assignRarities(filtered)

      setCharacters(withRarity)
      setCacheData(withRarity)

      const byRarity: Record<Rarity, Character[]> = {
        Comum: [], Incomum: [], Raro: [], Épico: [], Lendário: [], Mítico: []
      }
      withRarity.forEach(c => {
        if (c.rarity) byRarity[c.rarity].push(c)
      })
      setCharactersByRarity(byRarity)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  const handleOpenPack = () => {
    const results = drawMultiple(charactersByRarity, 5)
    setPackCards(results)
    setShowPack(true)
  }

  const handlePackComplete = () => {
    setShowSummary(true)
    setShowPack(false)
    addToCollection(packCards)
  }

  const handlePackCancel = () => {
    setShowPack(false)
    setPackCards([])
  }

  const handleSummaryOpenAnother = () => {
    setShowSummary(false)
    const results = drawMultiple(charactersByRarity, 5)
    setPackCards(results)
    setShowPack(true)
  }

  const handleSummaryClose = () => {
    setShowSummary(false)
    setPackCards([])
  }

  return (
    <ThemeProvider>
      <>
        {showAdmin ? (
          <AdminPanel characters={characters} onClose={() => setShowAdmin(false)} />
        ) : (
        <>
          <AppShell activeTab={activeTab} onTabChange={setActiveTab} collection={collection} onAdmin={() => setShowAdmin(true)}>
            {activeTab === 'Packs' && !showPack && <PacksTab onOpenPack={handleOpenPack} />}
            {activeTab === 'Coleção' && <ColecaoTab collection={collection} />}
            {activeTab === 'Ranking' && (
              <RankingTab
                characters={characters}
                getRarityStats={getRarityStats}
              />
            )}
          </AppShell>
          {showPack && packCards.length > 0 && (
            <PackOpeningScreen
              cards={packCards}
              collection={collection}
              setCollection={setCollection}
              onComplete={handlePackComplete}
              onCancel={handlePackCancel}
            />
          )}
          {showSummary && packCards.length > 0 && (
            <SummaryScreen
              cards={packCards}
              onOpenAnother={handleSummaryOpenAnother}
              onClose={handleSummaryClose}
            />
          )}
        </>
      )}
      </>
    </ThemeProvider>
  )
}
