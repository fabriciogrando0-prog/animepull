import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Character, Rarity } from './RarityBadge'
import { getHighestRarity } from './RarityBadge'
import { PackSlotsPanel } from './PackSlotsPanel'
import { TearablePack } from './TearablePack'
import { StackPhase } from './StackPhase'
import { useTheme } from '../themes/ThemeContext'
import { useEffects } from './EffectsContext'

type Phase = 'pack' | 'stack' | 'summary'

interface PackOpeningScreenProps {
  cards: Character[]
  collection: Character[]
  setCollection: React.Dispatch<React.SetStateAction<Character[]>>
  onComplete: () => void
  onCancel: () => void
}

const RARITY_RGB: Record<Rarity, string> = {
  Comum: '255, 255, 255',
  Incomum: '34, 197, 94',
  Raro: '59, 130, 246',
  Épico: '168, 85, 247',
  Lendário: '251, 191, 36',
  Mítico: '244, 63, 94',
}

export function PackOpeningScreen({
  cards,
  collection,
  setCollection,
  onComplete,
  onCancel: _onCancel,
}: PackOpeningScreenProps) {
  const { theme } = useTheme()
  const { enabled: effectsEnabled } = useEffects()
  const [phase, setPhase] = useState<Phase>('pack')
  const [tearing, setTearing] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [revealedSlots, setRevealedSlots] = useState<(Character | null)[]>(Array(5).fill(null))

  const highestRarity = getHighestRarity(cards)
  const shakeCfg = effectsEnabled && tearing && (highestRarity === 'Lendário' || highestRarity === 'Mítico')
    ? { px: highestRarity === 'Mítico' ? 8 : 4, ms: highestRarity === 'Mítico' ? 600 : 400 }
    : null

  const tearPack = useCallback(() => {
    if (phase !== 'pack' || tearing) return
    setTearing(true)
  }, [phase, tearing])

  useEffect(() => {
    if (!tearing) return
    const t = setTimeout(() => setPhase('stack'), 1300)
    return () => clearTimeout(t)
  }, [tearing])

  const handleCardSave = useCallback((card: Character) => {
    try {
      setCollection((prev) => {
        const ids = new Set(prev.map((c) => c.id))
        return ids.has(card.id) ? prev : [...prev, card]
      })
    } catch {}
  }, [setCollection])

  const handleReveal = useCallback((card: Character, index: number) => {
    setRevealedSlots((prev) => {
      const next = [...prev]
      next[index] = card
      return next
    })
  }, [])

  useEffect(() => {
    if (phase !== 'summary') return
    onComplete()
  }, [phase, onComplete])

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      if (phase === 'pack') {
        tearPack()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [phase, tearPack])

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden')
    onVis()
    window.addEventListener('visibilitychange', onVis)
    return () => window.removeEventListener('visibilitychange', onVis)
  }, [])

  const playState = hidden ? 'paused' : 'running'
  const shakeAnim = shakeCfg ? `screen-shake-${shakeCfg.px} ${shakeCfg.ms}ms ease-in-out` : 'none'

  const bg = `radial-gradient(circle at center, #07070c 0%, ${theme.palette.accent}26 50%, #050508 100%)`
  const kbd = {
    display: 'inline-block',
    px: 1.5,
    py: 0.5,
    rounded: true as const,
    border: '1px solid #6b7280',
    background: '#1f2937',
  } as React.CSSProperties

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col lg:flex-row"
      style={{
        background: bg,
        animation: shakeAnim,
        animationPlayState: playState,
      } as React.CSSProperties}>
      {shakeCfg && highestRarity === 'Mítico' && (
        <div
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{
            background: `rgb(${RARITY_RGB[highestRarity]})`,
            animation: 'flash 600ms ease-in-out',
            animationPlayState: playState,
          } as React.CSSProperties}>
        </div>
      )}
      {phase !== 'pack' && (
        <PackSlotsPanel
          cards={revealedSlots}
          collection={collection}
          className="w-full shrink-0 lg:w-[280px] lg:max-w-[280px] p-6 gap-4 lg:justify-between"
          animate={phase === 'stack'}
        />
      )}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-w-0">
        <AnimatePresence mode="wait">
          {phase === 'pack' && (
            <motion.div
              key="pack"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}>
              <TearablePack
                src={`${import.meta.env.BASE_URL}packs/${theme.arquivo}`}
                rarity={highestRarity}
                paused={hidden}
                effectsEnabled={effectsEnabled}
                onTearComplete={tearPack}
              />
              <p className="text-center text-gray-300 text-sm">
                Toque no pack para rasgar, ou (
                <kbd style={kbd}>Espaço</kbd>)
              </p>
            </motion.div>
          )}
          {phase === 'stack' && (
            <motion.div
              key="stack"
              className="flex-1 w-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}>
              <StackPhase
                cards={cards}
                onSave={handleCardSave}
                onReveal={handleReveal}
                onComplete={() => setPhase('summary')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
