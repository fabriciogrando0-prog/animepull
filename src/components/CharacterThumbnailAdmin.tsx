import type { Character } from './RarityBadge'

interface CharacterThumbnailAdminProps {
  character: Character
}

export function CharacterThumbnailAdmin({ character }: CharacterThumbnailAdminProps) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const hasImage = Boolean(character.image.large)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-2 flex flex-col h-full">
      <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-800 mb-2">
        {hasImage ? (
          <img
            src={character.image.medium}
            alt={character.name.full}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
            Sem imagem
          </div>
        )}
      </div>
      <h4 className="text-sm font-semibold line-clamp-1">{character.name.full}</h4>
      <p className="text-xs text-gray-400 truncate">{animeTitle}</p>
      <p className="text-xs text-gray-500 mt-1">Resolução AniList: 230 × 345 px</p>
      <p className="text-xs text-gray-600 mt-1">Alternativa: n\u00e3o cadastrada</p>
    </div>
  )
}
