import { useEffect } from 'react'
import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { RarityFrame } from './RarityFrame'

export function CardDetailModal({ card, onClose }: { card: Character; onClose: () => void }) {
  const colors = RARITY_COLORS[card.rarity ?? 'Comum']
  const animeNode = card.media.nodes.find((node) => node.type === 'ANIME')
  const animeTitle = animeNode?.title.english || animeNode?.title.romaji || ''

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}>
      <div
        className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-2 border-solid relative"
        style={{ backgroundColor: 'var(--surface)', borderColor: colors.primary }}
        onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded flex items-center justify-center text-black border-2 border-solid"
          style={{ backgroundColor: 'var(--bg)', borderColor: colors.primary }}
          aria-label="Fechar">
          ×
        </button>
        <div className="flex flex-col items-center">
          <div className="aspect-[2/3] w-full max-w-[340px] relative mx-auto">
            <RarityFrame rarity={card.rarity ?? 'Comum'}>
              <div className="flex flex-col h-full w-full overflow-hidden">
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={card.image.large}
                    alt={card.name.full}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60">
                    <div className="text-white font-bold text-sm leading-tight">{card.name.full}</div>
                    {animeTitle && <div className="text-gray-300 text-xs mt-0.5">{animeTitle}</div>}
                  </div>
                </div>
              </div>
            </RarityFrame>
          </div>
          {card.name.native && (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">{card.name.native}</p>
          )}
          <span
            className="inline-block px-2 py-1 mt-2 rounded text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: colors.primary, color: '#0b0b14' }}>
            {card.rarity ?? 'Comum'}
          </span>
          <p className="mt-2 text-sm">
            Favoritos: {card.favourites.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}
