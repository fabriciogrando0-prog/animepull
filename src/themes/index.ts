import type { Theme } from './types'
import { matsuriTheme } from './matsuri/matsuri'

export const themes: Theme[] = [
  {
    id: 'teste-a',
    name: 'Teste A',
    palette: {
      bg: '#1e1b4b',
      surface: '#312e81',
      accent: '#6366f1',
      accent2: '#f59e0b',
      text: '#e0e7ff',
      muted: '#c7d2fe',
    },
  },
  {
    id: 'teste-b',
    name: 'Teste B',
    palette: {
      bg: '#0f4c5c',
      surface: '#176b87',
      accent: '#22d3ee',
      accent2: '#f472b6',
      text: '#ccfbf1',
      muted: '#a5f3fc',
    },
  },
  matsuriTheme,
]

export function pickRandomTheme(excludeId?: string): Theme {
  const candidates = excludeId ? themes.filter(t => t.id !== excludeId) : themes
  if (candidates.length === 0) return themes[0]
  return candidates[Math.floor(Math.random() * candidates.length)]
}
