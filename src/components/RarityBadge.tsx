export type Rarity = 'Comum' | 'Incomum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico'

export interface CharacterName {
  full: string
  native?: string
}

export interface CharacterImage {
  large: string
  medium: string
}

export interface CharacterMediaNode {
  title: {
    romaji: string
    english?: string
  }
  type: string
  isAdult?: boolean
}

export interface CharacterMedia {
  nodes: CharacterMediaNode[]
}

export interface Character {
  id: number
  name: CharacterName
  image: CharacterImage
  media: CharacterMedia
  favourites: number
  rarity?: Rarity
}

export const RARITY_RANGES: Record<Rarity, { start: number; end: number }> = {
  Mítico: { start: 0, end: 4 },
  Lendário: { start: 5, end: 24 },
  Épico: { start: 25, end: 74 },
  Raro: { start: 75, end: 174 },
  Incomum: { start: 175, end: 324 },
  Comum: { start: 325, end: 499 },
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  Comum: 55,
  Incomum: 25,
  Raro: 12,
  Épico: 5,
  Lendário: 2.5,
  Mítico: 0.5,
}

export const RARITY_COLORS: Record<Rarity, {
  bg: string
  border: string
  glow: string
  text: string
  primary: string
  secondary: string
  glowColor: string
  gradient: string
}> = {
  Comum: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    glow: '',
    text: 'text-gray-900 dark:text-gray-100',
    primary: '#9ca3af',
    secondary: '#6b7280',
    glowColor: 'rgba(156, 163, 175, 0.6)',
    gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
  },
  Incomum: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    glow: 'shadow-green-300/30 dark:shadow-green-700/30',
    text: 'text-green-900 dark:text-green-100',
    primary: '#22c55e',
    secondary: '#16a34a',
    glowColor: 'rgba(34, 197, 94, 0.7)',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
  },
  Raro: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    glow: 'shadow-blue-300/30 dark:shadow-blue-700/30',
    text: 'text-blue-900 dark:text-blue-100',
    primary: '#3b82f6',
    secondary: '#2563eb',
    glowColor: 'rgba(59, 130, 246, 0.7)',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  Épico: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-300 dark:border-purple-700',
    glow: 'shadow-purple-300/30 dark:shadow-purple-700/30',
    text: 'text-purple-900 dark:text-purple-100',
    primary: '#a855f7',
    secondary: '#9333ea',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
  },
  Lendário: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    glow: 'shadow-yellow-300/40 dark:shadow-yellow-700/40',
    text: 'text-yellow-900 dark:text-yellow-100',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
  },
  Mítico: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-300 dark:border-rose-700',
    glow: 'shadow-rose-300/50 dark:shadow-rose-700/50 animate-pulse',
    text: 'text-rose-900 dark:text-rose-100',
    primary: '#f43f5e',
    secondary: '#e11d48',
    glowColor: 'rgba(244, 63, 94, 0.9)',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #f472b6 100%)'
  },
}

export function getHighestRarity(cards: Character[]): Rarity {
  const rarityOrder: Rarity[] = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico']
  let highest: Rarity = 'Comum'
  for (const card of cards) {
    if (card.rarity && rarityOrder.indexOf(card.rarity) > rarityOrder.indexOf(highest)) {
      highest = card.rarity
    }
  }
  return highest
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
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
