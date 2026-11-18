import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { RarityFrame } from './RarityFrame'
import { CardBack as ThemeCardBack } from '../themes/CardBack'
import { themes } from '../themes/index'
import { useTheme } from '../themes/ThemeContext'

export function CardDetailModal({ card, onClose }: { card: Character; onClose: () => void }) {
  const { theme: currentTheme } = useTheme()
  const backTheme = themes.find((t) => t.id === (card.temaOrigem ?? currentTheme.id)) ?? currentTheme
  const colors = RARITY_COLORS[card.rarity ?? 'Comum']
  const animeNode = card.media.nodes.find((node) => node.type === 'ANIME')
  const animeTitle = animeNode?.title.english || animeNode?.title.romaji || ''
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [onClose])

  const cardStyle: React.CSSProperties = {
    width: 'min(92vw, 520px)',
    maxHeight: '88vh',
    aspectRatio: '2/3',
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
            className="relative w-full h-full max-w-full max-h-full">
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
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
              <RarityFrame rarity={card.rarity ?? 'Comum'}>
                <div className="flex flex-col h-full w-full overflow-hidden">
                  <div className="relative w-full h-full overflow-hidden">
                    <img src={card.image.large} alt={card.name.full} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60">
                      <div className="text-white font-bold text-sm leading-tight">{card.name.full}</div>
                      {animeTitle && <div className="text-gray-300 text-xs mt-0.5">{animeTitle}</div>}
                    </div>
                  </div>
                </div>
              </RarityFrame>
              <span
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: colors.primary, color: '#0b0b14' }}>
                {card.rarity ?? 'Comum'}
              </span>
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
        <div className="mt-6 flex flex-col items-center gap-2 text-gray-300">
          <p className="text-sm font-semibold">{card.name.full}</p>
          {card.name.native && <p className="text-xs text-gray-500">{card.name.native}</p>}
          <p className="text-xs">Favoritos: {card.favourites.toLocaleString('pt-BR')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded flex items-center justify-center text-black border-2 border-solid"
          style={{ backgroundColor: 'var(--bg)', borderColor: colors.primary }}
          aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
  )
}
