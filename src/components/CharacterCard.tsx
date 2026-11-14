import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'

interface CharacterCardProps {
  character: Character
  showRarity?: boolean
  className?: string
}

export function CharacterCard({ character, showRarity = true, className = '' }: CharacterCardProps) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]

  return (
    <div className={`relative rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border-2 ${colors.border} bg-gray-900 ${colors.glow} ${className}`}>
      <div className="relative h-64 w-full overflow-hidden">
        <img
          src={character.image.large}
          alt={character.name.full}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
          <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
            ❤ {character.favourites.toLocaleString()}
          </span>
        </div>
        {showRarity && (
          <div className="absolute top-3 left-3 right-3 flex justify-between">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
              {rarity}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-white">
          {character.name.full}
          {character.name.native && (
            <span className="text-sm font-normal text-gray-300 block">
              {character.name.native}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-300 mt-auto flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {animeTitle}
        </p>
      </div>
    </div>
  )
}
