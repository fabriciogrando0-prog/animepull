import { useEffect } from 'react'
import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'

export function CardDetailModal({ card, onClose }: { card: Character; onClose: () => void }) {
  const colors = RARITY_COLORS[card.rarity ?? 'Comum']
  const animeNode = card.media.nodes.find((node) => node.type === 'ANIME')

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
        className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 border-2 border-solid relative"
        style={{ backgroundColor: 'var(--surface)', borderColor: colors.primary }}
        onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:opacity-80 transition-opacity"
          aria-label="Fechar">
          ×
        </button>
        <img
          src={card.image.large}
          alt={card.name.full}
          className="aspect-[2/3] w-full object-cover rounded-xl border-4 border-solid mb-4"
          style={{ borderColor: colors.primary }}
        />
        <h2 className="text-xl font-bold">{card.name.full}</h2>
        {card.name.native && (
          <p className="text-sm text-gray-400 dark:text-gray-500">{card.name.native}</p>
        )}
        {animeNode && (
          <p className="text-sm font-medium">{animeNode.title.english || animeNode.title.romaji}</p>
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
  )
}
