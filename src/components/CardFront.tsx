import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { CardBack as ThemeCardBack } from '../themes/CardBack'
import { RarityFrame } from './RarityFrame'

interface CardFrontProps {
  character: Character
  isHighRarity?: boolean
}

export function CardFront({ character, isHighRarity = false }: CardFrontProps) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]

  return (
    <RarityFrame
      rarity={rarity}
      intensity={1}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="flex flex-col h-full">
        <div className="relative w-full h-5/6 overflow-hidden">
          {isHighRarity && (
            <div className="absolute inset-0 overflow-hidden rounded-t-2xl" style={{
              background: `linear-gradient(135deg, ${colors.primary}10 0%, transparent 50%, ${colors.secondary}10 100%)`,
              animation: 'holographic 3s ease-in-out infinite',
            }}>
              <div className="absolute inset-0" style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  ${colors.primary}03 2px,
                  ${colors.primary}03 4px
                )`,
                animation: 'scanlines 0.1s linear infinite',
              }} />
            </div>
          )}
          <img
            src={character.image.large}
            alt={character.name.full}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
              ❤ {character.favourites.toLocaleString()}
            </span>
          </div>
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
              {rarity}
            </span>
          </div>
        </div>
        <div className="p-3 flex flex-col flex-1 min-h-0">
          <h3 className="text-base font-semibold mb-1 line-clamp-2 text-white">
            {character.name.full}
            {character.name.native && (
              <span className="text-xs font-normal text-gray-300 block">
                {character.name.native}
                </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024 .195 1.414 .586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {animeTitle}
          </p>
        </div>
      </div>
    </RarityFrame>
  )
}

export function CardBack() {
  return <ThemeCardBack />
}
