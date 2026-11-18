import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { RarityFrame } from './RarityFrame'

interface ColecaoCardFrontProps {
  character: Character
}

export function ColecaoCardFront({ character }: ColecaoCardFrontProps) {
  const sourceAnime = character.media.nodes.find((m) => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]

  return (
    <RarityFrame rarity={rarity} intensity={1}>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="relative flex-1 overflow-hidden">
          <img
            src={character.image.large}
            alt={character.name.full}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Faixa vertical integrada à carta com a cor da raridade */}
          <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colors.primary }} />
          {/* Selo lateral de raridade */}
          <div className="absolute top-4 left-4">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg border border-white/20"
              style={{
                backgroundColor: colors.primary,
                color: '#0b0b14',
                borderColor: colors.primary,
              }}
            >
              {rarity}
            </span>
          </div>
        </div>
        {/* Faixa inferior integrada à carta: nome do personagem + anime */}
        <div className="bg-[#0b0b14]/55 backdrop-blur-sm p-3 border-t border-white/10">
          <h3 className="text-white font-semibold text-sm leading-tight">{character.name.full}</h3>
          <p className="text-[#cbd5e1] text-[11px] mt-0.5 leading-snug">{animeTitle}</p>
        </div>
      </div>
    </RarityFrame>
  )
}
