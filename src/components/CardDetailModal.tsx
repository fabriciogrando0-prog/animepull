import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Character } from './RarityBadge'
import { ColecaoCardFront } from './ColecaoCardFront'
import { CardBack as ThemeCardBack } from '../themes/CardBack'
import { themes } from '../themes/index'
import { useTheme } from '../themes/ThemeContext'

export function CardDetailModal({ card, onClose }: { card: Character; onClose: () => void }) {
  const { theme: currentTheme } = useTheme()
  const backTheme = themes.find((t) => t.id === (card.temaOrigem ?? currentTheme.id)) ?? currentTheme
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [onClose])

  const cardStyle: React.CSSProperties = {
    width: 'min(94vw, 600px)',
    maxHeight: '92vh',
    aspectRatio: '2/3',
    overflow: 'hidden',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: '0', zIndex: 9998, backgroundColor: '#000000' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}>
      <div className="flex w-full h-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <motion.div
            style={{ ...cardStyle, cursor: 'pointer' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setFlipped((prev) => !prev)}
            className="relative w-full h-full">
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'relative',
              transformStyle: 'preserve-3d',
              perspective: 1000,
              width: '100%',
              height: '100%',
            }}
            className="relative w-full h-full">
            <div
              className="w-full h-full"
              style={{
                position: 'absolute',
                inset: '0',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
              }}>
              <ColecaoCardFront character={card} />
            </div>
            <div
              className="w-full h-full"
              style={{
                position: 'absolute',
                inset: '0',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                transformStyle: 'preserve-3d',
              }}>
              <ThemeCardBack theme={backTheme} />
            </div>
          </motion.div>
        </motion.div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded flex items-center justify-center text-black border-2 border-solid"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--accent)' }}
          aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
  )
}
