import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { themes, pickRandomTheme } from './index'
import type { Theme } from './types'

interface ThemeContextValue {
  theme: Theme
  nextTheme: () => void
  setThemeById: (id: string) => void
}

const SELECTED_KEY = 'animepull_selected_pack'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const id = localStorage.getItem(SELECTED_KEY)
      if (id) {
        const found = themes.find(t => t.id === id)
        if (found) return found
      }
    } catch {}
    return themes[0]
  })

  const applyVars = (t: Theme) => {
    const root = document.documentElement
    root.style.setProperty('--bg', t.palette.bg)
    root.style.setProperty('--surface', t.palette.surface)
    root.style.setProperty('--accent', t.palette.accent)
    root.style.setProperty('--accent2', t.palette.accent2)
    root.style.setProperty('--text', t.palette.text)
    root.style.setProperty('--muted', t.palette.muted)
  }

  useEffect(() => {
    applyVars(theme)
    try {
      localStorage.setItem(SELECTED_KEY, theme.id)
    } catch {}
  }, [theme])

  const nextTheme = () => {
    setTheme(prev => pickRandomTheme(prev.id))
  }

  const setThemeById = (id: string) => {
    const found = themes.find(t => t.id === id)
    if (found) setTheme(found)
  }

  return (
    <ThemeContext.Provider value={{ theme, nextTheme, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return ctx
}
