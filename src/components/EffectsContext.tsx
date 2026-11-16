import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface EffectsContextValue {
  enabled: boolean
  toggleEffects: () => void
}

const EffectsContext = createContext<EffectsContextValue | undefined>(undefined)

export function EffectsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('animepull.effects')
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('animepull.effects', String(enabled))
    } catch {
      // sem storage disponível: mantém apenas na memória
    }
  }, [enabled])

  const toggleEffects = () => setEnabled(prev => !prev)

  return (
    <EffectsContext.Provider value={{ enabled, toggleEffects }}>
      {children}
    </EffectsContext.Provider>
  )
}

export function useEffects(): EffectsContextValue {
  const ctx = useContext(EffectsContext)
  if (!ctx) {
    throw new Error('useEffects deve ser usado dentro de um EffectsProvider')
  }
  return ctx
}
