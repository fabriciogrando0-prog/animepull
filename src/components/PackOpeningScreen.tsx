import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character } from './RarityBadge'
import { PackArt } from './PackArt'
import { CardFront, CardBack } from './CardFront'
import { PackSlotsPanel } from './PackSlotsPanel'
import { useTheme } from '../themes/ThemeContext'

type Phase = 'pack' | 'tearing' | 'stack' | 'summary'

interface PackOpeningScreenProps {
  cards: Character[]
  collection: Character[]
  onComplete: () => void
  onCancel: () => void
  onCardFlipped?: (index: number) => void
}

export function PackOpeningScreen({
  cards,
  collection,
  onComplete,
  onCancel: _onCancel,
  onCardFlipped,
}: PackOpeningScreenProps) {
  const { theme } = useTheme()
  const [phase, setPhase] = useState<Phase>('pack')
  const [stackIndex, setStackIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const tearPack = useCallback(() => {
    if (phase !== 'pack') return
    setPhase('stack')
  }, [phase])

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
        setPhase('stack')
      } else if (phase === 'stack') {
        nextStackCard()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [phase, nextStackCard])

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
    <div className="fixed inset-0 z-[9999] flex flex-col lg:flex-row" style={{ background: bg }}>
      <PackSlotsPanel
        cards={cards}
        collection={collection}
        className="w-full shrink-0 lg:w-[280px] lg:max-w-[280px] p-6 gap-4 lg:justify-between"
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-w-0">
        {phase === 'pack' && (
          <>
            <div
              onClick={tearPack}
              onKeyDown={(e) => { if (e.code === 'Space') tearPack() }}
              role="button"
              tabIndex={0}
              style={{ transform: 'rotate(3deg)', transition: 'transform 0.2s ease', display: 'inline-block' }}
              className="cursor-pointer select-none"
            >
              <PackArt onClick={tearPack} />
            </div>
            <p className="text-center text-gray-300 text-sm">
              Deslize no topo do pack para rasgar, ou toque (
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
