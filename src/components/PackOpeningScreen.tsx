import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character, Rarity } from './RarityBadge'
import { getHighestRarity } from './RarityBadge'
import { CardFront, CardBack } from './CardFront'
import { PackSlotsPanel } from './PackSlotsPanel'
import { TearablePack } from './TearablePack'
import { useTheme } from '../themes/ThemeContext'
import { useEffects } from './EffectsContext'

type Phase = 'pack' | 'stack' | 'summary'

interface PackOpeningScreenProps {
  cards: Character[]
  collection: Character[]
  onComplete: () => void
  onCancel: () => void
  onCardFlipped?: (index: number) => void
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
  onComplete,
  onCancel: _onCancel,
  onCardFlipped,
}: PackOpeningScreenProps) {
  const { theme } = useTheme()
  const { enabled: effectsEnabled } = useEffects()
  const [phase, setPhase] = useState<Phase>('pack')
  const [stackIndex, setStackIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tearing, setTearing] = useState(false)
  const [hidden, setHidden] = useState(false)

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

  const nextStackCard = useCallback(() => {
    if (!flipped) {
      setFlipped(true)
      onCardFlipped?.(stackIndex)
      return
    }
    if (stackIndex >= cards.length - 1) {
      setPhase('summary')
      return
    }
    setStackIndex(stackIndex + 1)
    setFlipped(false)
  }, [flipped, stackIndex, cards.length, onCardFlipped])

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
      } else if (phase === 'stack') {
        nextStackCard()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [phase, nextStackCard, tearPack])

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
      <PackSlotsPanel
        cards={cards}
        collection={collection}
        className="w-full shrink-0 lg:w-[280px] lg:max-w-[280px] p-6 gap-4 lg:justify-between"
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-w-0">
        {phase === 'pack' && (
          <>
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
          </>
        )}
        {phase === 'stack' && (
          <>
            <p className="text-center text-gray-300 text-sm">
              Toque na carta para virar (
              <kbd style={kbd}>Espaço</kbd>)
            </p>
            <div
              className="relative w-72 sm:w-80 aspect-[2/3] cursor-pointer select-none"
              onClick={nextStackCard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.code === 'Space') nextStackCard() }}
            >
              <AnimatePresence mode="popLayout">
                {flipped ? (
                  <motion.div key="front" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                    <CardFront character={cards[stackIndex]} />
                  </motion.div>
                ) : (
                  <motion.div key="back" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                    <CardBack />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
