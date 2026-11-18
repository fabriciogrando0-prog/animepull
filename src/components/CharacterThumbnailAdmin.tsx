import type { Character } from './RarityBadge'

interface CharacterThumbnailAdminProps {
  character: Character
  selected: boolean
  onToggle: (id: number) => void
}

export function CharacterThumbnailAdmin({ character, selected, onToggle }: CharacterThumbnailAdminProps) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const hasImage = Boolean(character.image.large)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-2 flex flex-col h-full">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => onToggle(character.id)}
          aria-pressed={selected}
          title={selected ? 'Deselecionar' : 'Selecionar'}
          className={`rounded border p-1 text-gray-400 hover:text-[#e5e7eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] ${selected
            ? 'border-[#e5e7eb] text-[#e5e7eb] bg-[#e5e7eb]/20'
            : 'border-gray-600'}`}
        >
          {selected ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8H4m0 0H4m0 0l4 4m0 0L4 12" />
            </svg>
          )}
        </button>
      </div>
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
