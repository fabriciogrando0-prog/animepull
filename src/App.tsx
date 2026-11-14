import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Rarity = 'Comum' | 'Incomum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico'

interface Character {
  id: number
  name: {
    full: string
    native?: string
  }
  image: {
    large: string
    medium: string
  }
  media: {
    nodes: Array<{
      title: {
        romaji: string
        english?: string
      }
      type: string
      isAdult?: boolean
    }>
  }
  favourites: number
  rarity?: Rarity
}

interface ApiResponse {
  data?: {
    Page: {
      characters: Character[]
    }
  }
  errors?: Array<{ message: string }>
}

interface CachedData {
  characters: Character[]
  timestamp: number
}

const CACHE_KEY = 'anilist_500_characters'
const CACHE_DURATION = 24 * 60 * 60 * 1000
const TOTAL_PAGES = 10
const PER_PAGE = 50
const PAGE_DELAY = 300

const RARITY_RANGES: Record<Rarity, { start: number; end: number }> = {
  Mítico: { start: 0, end: 4 },
  Lendário: { start: 5, end: 24 },
  Épico: { start: 25, end: 74 },
  Raro: { start: 75, end: 174 },
  Incomum: { start: 175, end: 324 },
  Comum: { start: 325, end: 499 },
}

const RARITY_WEIGHTS: Record<Rarity, number> = {
  Comum: 55,
  Incomum: 25,
  Raro: 12,
  Épico: 5,
  Lendário: 2.5,
  Mítico: 0.5,
}

const RARITY_COLORS: Record<Rarity, { 
  bg: string; border: string; glow: string; text: string;
  primary: string; secondary: string; glowColor: string;
  gradient: string;
}> = {
  Comum: { 
    bg: 'bg-gray-100 dark:bg-gray-800', 
    border: 'border-gray-300 dark:border-gray-600', 
    glow: '', 
    text: 'text-gray-900 dark:text-gray-100',
    primary: '#9ca3af', secondary: '#6b7280', glowColor: 'rgba(156, 163, 175, 0.6)',
    gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
  },
  Incomum: { 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    border: 'border-green-300 dark:border-green-700', 
    glow: 'shadow-green-300/30 dark:shadow-green-700/30', 
    text: 'text-green-900 dark:text-green-100',
    primary: '#22c55e', secondary: '#16a34a', glowColor: 'rgba(34, 197, 94, 0.7)',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
  },
  Raro: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    border: 'border-blue-300 dark:border-blue-700', 
    glow: 'shadow-blue-300/30 dark:shadow-blue-700/30', 
    text: 'text-blue-900 dark:text-blue-100',
    primary: '#3b82f6', secondary: '#2563eb', glowColor: 'rgba(59, 130, 246, 0.7)',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  Épico: { 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    border: 'border-purple-300 dark:border-purple-700', 
    glow: 'shadow-purple-300/30 dark:shadow-purple-700/30', 
    text: 'text-purple-900 dark:text-purple-100',
    primary: '#a855f7', secondary: '#9333ea', glowColor: 'rgba(168, 85, 247, 0.7)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
  },
  Lendário: { 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
    border: 'border-yellow-300 dark:border-yellow-700', 
    glow: 'shadow-yellow-300/40 dark:shadow-yellow-700/40', 
    text: 'text-yellow-900 dark:text-yellow-100',
    primary: '#fbbf24', secondary: '#f59e0b', glowColor: 'rgba(251, 191, 36, 0.8)',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
  },
  Mítico: { 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    border: 'border-rose-300 dark:border-rose-700', 
    glow: 'shadow-rose-300/50 dark:shadow-rose-700/50 animate-pulse', 
    text: 'text-rose-900 dark:text-rose-100',
    primary: '#f43f5e', secondary: '#e11d48', glowColor: 'rgba(244, 63, 94, 0.9)',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #f472b6 100%)'
  },
}

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

    const result: ApiResponse = await response.json()

    if (result.errors) {
      throw new Error(result.errors.map(e => e.message).join(', '))
    }

    return result.data?.Page?.characters || []
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('NetworkError')) {
      throw new Error('Erro de rede: Verifique sua conexão ou tente novamente. A API pode estar bloqueando CORS.')
    }
    throw err
  }
}

async function fetchAllCharacters(onProgress?: (page: number, total: number) => void): Promise<Character[]> {
  const allCharacters: Character[] = []
  
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    if (onProgress) onProgress(page, TOTAL_PAGES)
    
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

function getCachedData(): CachedData | null {
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

function getCollection(): Character[] {
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

function getHighestRarity(cards: Character[]): Rarity {
  const rarityOrder: Rarity[] = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico']
  let highest: Rarity = 'Comum'
  for (const card of cards) {
    if (card.rarity && rarityOrder.indexOf(card.rarity) > rarityOrder.indexOf(highest)) {
      highest = card.rarity
    }
  }
  return highest
}

function CharacterCard({ character, showRarity = true, className = '' }: { character: Character; showRarity?: boolean; className?: string }) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]

  return (
    <div className={`relative rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border-2 ${colors.border} ${colors.bg} ${colors.glow} ${className}`}>
      <div className="relative h-64 w-full overflow-hidden">
        <img
          src={character.image.large}
          alt={character.name.full}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
          <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
            ❤ {character.favourites.toLocaleString()}
          </span>
        </div>
        {showRarity && (
          <div className="absolute top-3 left-3 right-3 flex justify-between">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
              {rarity}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-white">
          {character.name.full}
          {character.name.native && (
              <span className="text-sm font-normal text-gray-300 block">
                {character.name.native}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-300 mt-auto flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {animeTitle}
        </p>
      </div>
    </div>
  )
}

function CardFront({ character, rarityColor, isHighRarity = false }: { character: Character; rarityColor: string; isHighRarity?: boolean }) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]

  return (
    <div className="absolute inset-0 rounded-2xl border-4 overflow-hidden flex flex-col backface-hidden" style={{
      background: `linear-gradient(145deg, #0a0a12 0%, #121220 30%, #1a1a2e 60%, #0f0f1a 100%)`,
      borderColor: rarityColor,
      boxShadow: `0 0 30px ${rarityColor}80, inset 0 0 60px ${rarityColor}40, 0 20px 40px rgba(0,0,0,0.5)`,
      transform: 'rotateY(180deg)',
      transformStyle: 'preserve-3d',
    }}>
      <div className="relative w-full h-5/6 overflow-hidden">
        {isHighRarity && (
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl" style={{
            background: `linear-gradient(135deg, ${rarityColor}10 0%, transparent 50%, ${colors.secondary}10 100%)`,
            animation: 'holographic 3s ease-in-out infinite',
          }}>
            <div className="absolute inset-0" style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                ${rarityColor}03 2px,
                ${rarityColor}03 4px
              )`,
              animation: 'scanlines 0.1s linear infinite',
            }} />
          </div>
        )}
        <img
          src={character.image.large}
          alt={character.name.full}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
            ❤ {character.favourites.toLocaleString()}
          </span>
        </div>
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
            {rarity}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 min-h-0">
        <h3 className="text-base font-semibold mb-1 line-clamp-2 text-white">
          {character.name.full}
          {character.name.native && (
          <span className="text-xs font-normal text-gray-300 block">
            {character.name.native}
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {animeTitle}
        </p>
      </div>
    </div>
  )
}

function CardBack() {
  return (
    <div className="absolute inset-0 rounded-2xl border-4 overflow-hidden backface-hidden" style={{
      background: `linear-gradient(145deg, #1a0a2e 0%, #16213e 50%, #0f0f23 100%)`,
      borderColor: '#666666',
      boxShadow: `0 0 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)`,
      transformStyle: 'preserve-3d',
    }}>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)`
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        transformStyle: 'preserve-3d',
        textAlign: 'center',
        width: '100%',
      }}>
        <svg width="80" height="80" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }}>
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#fff' }} />
              <stop offset="100%" style={{ stopColor: '#fff' }} />
            </linearGradient>
          </defs>
          <polygon points="50,5 62,35 95,38 70,60 78,95 50,75 22,95 30,60 5,38 38,35" 
            fill="url(#starGradient)" stroke="#fff" strokeWidth="2" />
        </svg>
        <p className="mt-4 text-lg font-bold tracking-wider text-white" style={{ 
          textShadow: '0 0 10px rgba(255,255,255,0.5)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), #fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ANIMEPULL
        </p>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Booster Pack</p>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ zIndex: 5 }}>
        <p className="text-xs text-gray-400">Clique para revelar</p>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#666666', boxShadow: '0 0 10px rgba(102,102,102,0.5)' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#666666', boxShadow: '0 0 10px rgba(102,102,102,0.5)', opacity: 0.7 }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#666666', boxShadow: '0 0 10px rgba(102,102,102,0.5)', opacity: 0.4 }} />
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl" style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)`,
        opacity: 0.3,
        animation: 'pulse-glow 2s ease-in-out infinite',
      }} />
    </div>
  )
}

function FlipCard({ character, index, delay = 0, onFlipped }: { character: Character; index: number; delay?: number; onFlipped?: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const [revealEffect, setRevealEffect] = useState(false)
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]
  const rarityColor = colors.primary

  const handleClick = () => {
    if (!flipped) {
      setFlipped(true)
      setRevealEffect(true)
      setTimeout(() => setRevealEffect(false), 2000)
      onFlipped?.()
    }
  }

  const isHighRarity = ['Épico', 'Lendário', 'Mítico'].includes(rarity)
  const isMythic = rarity === 'Mítico'
  const isLegendary = rarity === 'Lendário'
  const isEpic = rarity === 'Épico'
  const isRare = rarity === 'Raro'

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, zIndex: 5 - index }}
      animate={{ scale: 1, opacity: 1, zIndex: flipped ? 10 : 5 - index }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className="relative w-72 h-96 sm:w-80 sm:h-112 cursor-pointer flex-shrink-0 snap-center"
      onClick={handleClick}
    >
      <AnimatePresence>
        {revealEffect && isMythic && (
          <motion.div
            key="mythic-flash"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 2.5, 4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${rarityColor} 0%, ${colors.secondary} 30%, transparent 70%)`,
              zIndex: 50,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isLegendary && (
          <motion.div
            key="legendary-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(circle, ${rarityColor} 0%, ${colors.secondary} 40%, transparent 70%)`,
              boxShadow: `0 0 150px ${rarityColor}, 0 0 300px ${colors.secondary}`,
              zIndex: 20,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isLegendary && (
          <motion.div
            key="legendary-shake"
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 25 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isEpic && (
          <>
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`epic-particle-${i}`}
                initial={{ x: 0, y: 0, scale: 0.5, opacity: 1, rotate: 0 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 300, 
                  y: (Math.random() - 0.5) * 300, 
                  scale: [1, 0], 
                  rotate: (Math.random() - 0.5) * 720,
                  opacity: 0 
                }}
                transition={{ duration: 1, delay: i * 0.02, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 6 + Math.random() * 10,
                  height: 6 + Math.random() * 10,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${rarityColor}, ${colors.secondary})`,
                  boxShadow: `0 0 20px ${rarityColor}`,
                  pointerEvents: 'none',
                  zIndex: 25,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isRare && (
          <motion.div
            key="rare-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 0] }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: `0 0 100px ${rarityColor}80, inset 0 0 100px ${rarityColor}40`,
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{ 
          rotateY: flipped ? 180 : 0,
          scale: isMythic && flipped ? 1.15 : 1,
        }}
        transition={{ 
          duration: 0.7, 
          ease: [0.25, 0.46, 0.45, 0.94],
          scale: { duration: 0.5, delay: 0.35 },
        }}
        style={{
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
        }}
        className="absolute inset-0"
      >
        <CardFront character={character} rarityColor={rarityColor} isHighRarity={isHighRarity} />
        <CardBack />
      </motion.div>

      {flipped && isMythic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 60px ${rarityColor}, 0 0 120px ${colors.secondary}, inset 0 0 60px ${rarityColor}40`,
            border: `2px solid ${rarityColor}`,
            animation: 'pulse-glow 1s ease-in-out infinite',
            zIndex: 5,
          }}
        />
      )}
    </motion.div>
  )
}

function Particle({ x, y, color, size, delay = 0 }: { x: number; y: number; color: string; size: number; delay?: number }) {
  const angle = Math.random() * Math.PI * 2
  const distance = 100 + Math.random() * 200
  const endX = Math.cos(angle) * distance
  const endY = Math.sin(angle) * distance
  const rotation = (Math.random() - 0.5) * 720

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
      animate={{ x: endX, y: endY, scale: [1, 0], rotate: rotation, opacity: 0 }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  )
}

function SummaryScreen({ 
  cards, 
  onOpenAnother, 
  onClose 
}: { 
  cards: Character[]; 
  onOpenAnother: () => void; 
  onClose: () => void 
}) {
  const highestRarity = getHighestRarity(cards)
  const rarityColors = RARITY_COLORS[highestRarity]
  const glowColor = rarityColors.primary

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.98)' }}
    >
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, ${glowColor}20 0%, transparent 70%)`,
      }} />
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-7xl"
      >
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black uppercase tracking-widest mb-4"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary}, #fff)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Pack Aberto!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-300"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {highestRarity} Pull Detectado! &nbsp;
            <span className="relative px-3 py-1 ml-2 text-sm font-bold uppercase tracking-wider rounded-full" style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              color: '#000',
              boxShadow: `0 0 20px ${glowColor}80`,
            }}>
              {highestRarity}
            </span>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="overflow-x-auto pb-4 -mx-4 px-4"
        >
          <div className="flex gap-4 min-w-max" style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}>
            {cards.map((card, index) => {
              const rarity = card.rarity || 'Comum'
              const colors = RARITY_COLORS[rarity]
              const isHighRarity = ['Épico', 'Lendário', 'Mítico'].includes(rarity)
              const sourceAnime = card.media.nodes.find(m => m.type === 'ANIME')
              const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'

              return (
                <motion.div
                  key={`${card.id}-${index}`}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex-shrink-0 w-64 sm:w-72"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <div className={`relative rounded-2xl border-4 overflow-hidden flex flex-col h-full ${colors.border} ${colors.glow}`} style={{
                    background: `linear-gradient(145deg, #0a0a12 0%, #121220 30%, #1a1a2e 60%, #0f0f1a 100%)`,
                    boxShadow: `0 0 30px ${colors.primary}80, inset 0 0 60px ${colors.primary}40, 0 20px 40px rgba(0,0,0,0.5)`,
                    borderColor: colors.primary,
                  }}>
                    {isHighRarity && (
                      <div className="absolute inset-0 overflow-hidden rounded-t-2xl pointer-events-none" style={{
                        background: `linear-gradient(135deg, ${colors.primary}10 0%, transparent 50%, ${colors.secondary}10 100%)`,
                        animation: 'holographic 3s ease-in-out infinite',
                      }}>
                        <div className="absolute inset-0" style={{
                          background: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            ${colors.primary}03 2px,
                            ${colors.primary}03 4px
                          )`,
                          animation: 'scanlines 0.1s linear infinite',
                        }} />
                      </div>
                    )}
                    <div className="relative w-full h-5/6 overflow-hidden">
                      <img
                        src={card.image.large}
                        alt={card.name.full}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
                        <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                          #{card.favourites.toLocaleString()} favoritos
                        </span>
                      </div>
                      <div className="absolute top-2 left-2 right-2 flex justify-between">
                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
                          {rarity}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1 min-h-0">
                      <h3 className={`text-base font-semibold mb-1 line-clamp-2 ${colors.text}`}>
                        {card.name.full}
                        {card.name.native && (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block">
                            {card.name.native}
                          </span>
                        )}
                      </h3>
        <p className="text-xs text-gray-300 mt-auto flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {animeTitle}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto"
        >
          <motion.button
            onClick={onOpenAnother}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-8 py-4 rounded-xl font-semibold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              boxShadow: `0 0 30px ${glowColor}60, 0 10px 30px rgba(0,0,0,0.3)`,
            }}
          >
            Abrir Outro Pack
          </motion.button>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-8 py-4 rounded-xl font-semibold text-gray-300 border border-gray-600 hover:border-gray-400 hover:bg-gray-800 transition-all"
          >
            Fechar
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function PackOpeningScreen({ 
  cards, 
  onComplete, 
  onCancel,
  onCardFlipped
}: { 
  cards: Character[]; 
  onComplete: () => void; 
  onCancel: () => void;
  onCardFlipped?: (index: number) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'tearing' | 'exploding' | 'revealing' | 'complete'>('idle')
  const [particles, setParticles] = useState<Array<{x: number; y: number; color: string; size: number}>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const highestRarity = getHighestRarity(cards)
  const rarityColors = RARITY_COLORS[highestRarity]
  
  const rarityGlowColors: Record<Rarity, string> = {
    Comum: '#9ca3af',
    Incomum: '#22c55e',
    Raro: '#3b82f6',
    Épico: '#a855f7',
    Lendário: '#fbbf24',
    Mítico: '#f43f5e',
  }

  const glowColor = rarityGlowColors[highestRarity]

  useEffect(() => {
    const sequence = async () => {
      setPhase('shaking')
      await new Promise(r => setTimeout(r, 500))
      
      setPhase('tearing')
      await new Promise(r => setTimeout(r, 400))
      
      setPhase('exploding')
      const centerX = containerRef.current?.getBoundingClientRect().width ? containerRef.current.getBoundingClientRect().width / 2 : 200
      const centerY = containerRef.current?.getBoundingClientRect().height ? containerRef.current.getBoundingClientRect().height / 2 : 250
      
      const newParticles: Array<{x: number; y: number; color: string; size: number}> = []
      const particleCount = 60
      for (let i = 0; i < particleCount; i++) {
        const colors = [glowColor, rarityColors.primary, rarityColors.secondary, '#fff']
        newParticles.push({
          x: centerX,
          y: centerY,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 12
        })
      }
      setParticles(newParticles)
      
      await new Promise(r => setTimeout(r, 800))
      
      setPhase('revealing')
      await new Promise(r => setTimeout(r, 1200))
      
      setPhase('complete')
    }
    sequence()
  }, [cards, glowColor, rarityColors.primary, rarityColors.secondary])

  if (phase === 'idle') return null

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.95)' }}
    >
      <AnimatePresence mode="wait">
        {(phase === 'shaking' || phase === 'tearing' || phase === 'exploding') && (
          <motion.div
            key="pack-tearing"
            initial={{ scale: 1, rotate: 0 }}
            animate={phase === 'shaking' ? { 
              rotate: [0, -5, 5, -5, 5, 0],
              scale: [1, 1.02, 1]
            } : phase === 'tearing' ? {
              rotate: [0, -8, 8, -8, 0],
              scale: [1, 1.1, 0.95, 1.15],
              skewX: [0, 5, -5, 0],
            } : {
              scale: [1.15, 2.5],
              rotate: [0, 0],
              opacity: [1, 0],
            }}
            transition={{
              duration: phase === 'shaking' ? 0.5 : phase === 'tearing' ? 0.4 : 0.6,
              ease: phase === 'exploding' ? 'easeIn' : 'easeInOut',
            }}
            style={{ transformOrigin: 'center bottom', zIndex: 10 }}
            className="relative w-72 h-96 sm:w-80 sm:h-112"
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
              background: 'linear-gradient(145deg, #0a0a12 0%, #121220 30%, #1a1a2e 60%, #0f0f1a 100%)',
              boxShadow: `0 0 60px ${glowColor}60, 0 30px 60px rgba(0,0,0,0.6)`,
              border: '2px solid',
              borderImage: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary}) 1`,
              transformStyle: 'preserve-3d',
            }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <svg width="100" height="100" viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 30px ${glowColor})` }}>
                  <defs>
                    <linearGradient id="tearStar" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={rarityColors.primary} />
                      <stop offset="50%" stopColor={rarityColors.secondary} />
                      <stop offset="100%" stopColor={glowColor} />
                    </linearGradient>
                    <filter id="tearGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <g filter="url(#tearGlow)">
                    <polygon points="60,12 73,46 108,52 81,78 88,112 60,95 32,112 39,78 12,52 47,46" 
                      fill="url(#tearStar)" stroke="#fff" strokeWidth="3" />
                    <circle cx="60" cy="60" r="18" fill="rgba(255,255,255,0.2)" stroke={glowColor} strokeWidth="2" />
                    <text x="60" y="66" fontSize="24" fontWeight="bold" fill="#fff" textAnchor="middle" fontFamily="system-ui" style={{ textShadow: `0 0 10px ${glowColor}` }}>
                      ★
                    </text>
                  </g>
                </svg>
                <p className="mt-6 text-2xl sm:text-3xl font-black uppercase tracking-widest text-white" style={{ 
                  background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary}, #fff)`, 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent', 
                  backgroundClip: 'text' 
                }}>
                  ANIMEPULL
                </p>
              </div>
              {phase === 'tearing' && (
                <motion.svg 
                  className="absolute inset-0" 
                  viewBox="0 0 320 448"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 20px ${glowColor})` }}
                >
                  <defs>
                    <linearGradient id="tearLine" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={glowColor} stopOpacity={0} />
                      <stop offset="50%" stopColor={glowColor} stopOpacity={1} />
                      <stop offset="100%" stopColor={rarityColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M160,0 Q180,80 160,160 Q140,240 160,320 Q180,400 160,448" 
                    stroke="url(#tearLine)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M160,0 Q140,80 160,160 Q180,240 160,320 Q140,400 160,448" 
                    stroke="url(#tearLine)" 
                    strokeWidth="3" 
                    fill="none" 
                    strokeLinecap="round"
                    style={{ opacity: 0.7 }}
                  />
                </motion.svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'exploding' && (
          <motion.div
            key="explosion"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3], opacity: [1, 0] }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${glowColor} 0%, ${rarityColors.primary} 40%, ${rarityColors.secondary} 70%, transparent 100%)`,
              boxShadow: `0 0 200px ${glowColor}, 0 0 400px ${rarityColors.primary}`,
              width: '200px', height: '200px',
              zIndex: 20,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'exploding' && (
          <>
            {particles.map((particle, i) => (
              <Particle
                key={i}
                x={particle.x}
                y={particle.y}
                color={particle.color}
                size={particle.size}
                delay={i * 0.01}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === 'revealing' || phase === 'complete') && (
          <motion.div
            key="cards-reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-30 w-full overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
            style={{ perspective: 1000 }}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-max" style={{ transformStyle: 'preserve-3d' }}>
              {cards.map((card, index) => (
                <FlipCard 
                  key={`${card.id}-${index}`}
                  character={card}
                  index={index}
                  delay={index}
                  onFlipped={() => onCardFlipped?.(index)}
                />
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 text-center w-full"
            >
              <p className="text-lg font-semibold text-white mb-2" style={{ 
                background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent', 
                backgroundClip: 'text' 
              }}>
                {highestRarity} Pull Detectado!
              </p>
              <p className="text-gray-400 text-sm">Clique em qualquer card para virar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4"
        >
          <button
            onClick={onComplete}
            className="px-8 py-3 rounded-xl font-semibold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              boxShadow: `0 0 30px ${glowColor}60`
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Ver Cards
          </button>
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-xl font-semibold text-gray-300 border border-gray-600 hover:border-gray-400 hover:bg-gray-800 transition-all"
          >
            Abrir Outro
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden h-full animate-pulse border-2 border-gray-200 dark:border-gray-700">
      <div className="h-64 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-auto" />
      </div>
    </div>
  )
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const colors = RARITY_COLORS[rarity]
  const weight = RARITY_WEIGHTS[rarity]
  const range = RARITY_RANGES[rarity]
  const count = range.end - range.start + 1
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${colors.text} ${colors.border} border-2`}>
        {rarity.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{rarity}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {weight}% chance • Ranking #{range.start + 1}–#{range.end + 1} ({count} chars)
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [charactersByRarity, setCharactersByRarity] = useState<Record<Rarity, Character[]>>({
    Comum: [], Incomum: [], Raro: [], Épico: [], Lendário: [], Mítico: []
  })
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ current: 0, total: TOTAL_PAGES })
  const [error, setError] = useState<string | null>(null)
  const [drawnCards, setDrawnCards] = useState<Character[]>([])
  const [drawing, setDrawing] = useState(false)
  const [showPack, setShowPack] = useState(false)
  const [packCards, setPackCards] = useState<Character[]>([])
  const [showSummary, setShowSummary] = useState(false)

  const loadCharacters = useCallback(async () => {
    setLoading(true)
    setError(null)
    setProgress({ current: 0, total: TOTAL_PAGES })

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
      setLoading(false)
      return
    }

    try {
      const data = await fetchAllCharacters((current, total) => {
        setProgress({ current, total })
      })
      
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
      setError(err instanceof Error ? err.message : 'Erro ao buscar personagens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  const handleRefresh = async () => {
    try {
      localStorage.removeItem(CACHE_KEY)
      await loadCharacters()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    }
  }

  const handleOpenPack = () => {
    const results = drawMultiple(charactersByRarity, 5)
    setPackCards(results)
    setShowPack(true)
  }

  const handleCardFlipped = (_index: number) => {
    // Auto-show summary when all cards are flipped (handled by checking in onFlipped)
    // We use a ref to track flipped count to avoid stale closure
    // For simplicity, we'll just trigger after a delay when the last card is flipped
    // The actual tracking is done via the onFlipped callback
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

  const handleDrawMultiple = (count: number) => {
    setDrawing(true)
    setTimeout(() => {
      const results = drawMultiple(charactersByRarity, count)
      setDrawnCards(results)
      setDrawing(false)
    }, 100)
  }

  const getRarityStats = () => {
    return Object.entries(charactersByRarity).map(([rarity, chars]) => ({
      rarity: rarity as Rarity,
      count: chars.length,
      weight: RARITY_WEIGHTS[rarity as Rarity]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 relative">
      <AnimatePresence mode="wait">
        {showPack && packCards.length > 0 && (
          <PackOpeningScreen 
            cards={packCards} 
            onComplete={handlePackComplete}
            onCancel={handlePackCancel}
            onCardFlipped={handleCardFlipped}
          />
        )}
        {showSummary && packCards.length > 0 && (
          <SummaryScreen
            cards={packCards}
            onOpenAnother={handleSummaryOpenAnother}
            onClose={handleSummaryClose}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        {!showPack && (
          <>
            <header className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
              >
                AnimePull - Sistema de Raridades
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-600 dark:text-gray-400"
              >
                Top 500 personagens do AniList • Sorteio por raridade
              </motion.p>
            </header>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center justify-between"
              >
                <span>{error}</span>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                >
                  Tentar novamente
                </button>
              </motion.div>
            )}

            {loading && characters.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Buscando {TOTAL_PAGES} páginas da AniList...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Página {progress.current} de {progress.total}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div 
                      className="bg-purple-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {[...Array(10)].map((_, i) => (
                    <LoadingSkeleton key={i} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <motion.button
                    onClick={handleOpenPack}
                    disabled={drawing}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-3 mx-auto"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {drawing ? (
                      <>
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Preparando Pack...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Abrir Pack (5 Cards)
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {drawnCards.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                      Resultado do Sorteio
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                      {drawnCards.map((character, index) => (
                        <motion.div
                          key={`${character.id}-${index}`}
                          initial={{ opacity: 0, y: 30, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                        >
                          <CharacterCard character={character} showRarity={true} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => handleDrawMultiple(5)}
                        disabled={drawing}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        Sortear mais 5 (sem animação)
                      </button>
                    </div>
                  </motion.section>
                )}

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Tabela de Raridades
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {['Mítico', 'Lendário', 'Épico', 'Raro', 'Incomum', 'Comum'].map(rarity => (
                      <RarityBadge key={rarity} rarity={rarity as Rarity} />
                    ))}
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Estatísticas do Pool Atual
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {getRarityStats().map(({ rarity, count, weight }) => {
                      const colors = RARITY_COLORS[rarity]
                      return (
                        <div key={rarity} className={`p-4 rounded-lg border text-center ${colors.border} ${colors.bg}`}>
                          <div className="text-3xl font-bold">{count}</div>
                          <div className="text-sm font-medium">{rarity}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{weight}% chance</div>
                        </div>
                      )
                    })}
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Top {Math.min(50, characters.length)} Personagens
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {characters.slice(0, 50).map((character) => (
                      <CharacterCard key={character.id} character={character} showRarity={true} />
                    ))}
                  </div>
                </motion.section>

                <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>Dados fornecidos por <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">AniList</a></p>
                  <p className="mt-1">Cache válido por 24 horas • {characters.length} personagens carregados • Conteúdo adulto filtrado</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}