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
      <div className="flex flex-col h-full w-full overflow-hidden bg-[#0b0b14]">
        <div className="relative flex-1 overflow-hidden">
          <img
            src={character.image.large}
            alt={character.name.full}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Placa lateral de destaque da raridade */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: '14px',
              backgroundColor: colors.primary,
            }}
          />
          {/* Selo de raridade integrado */}
          <div className="absolute top-4 left-4 z-10">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xl border border-white/30"
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
        {/* Faixa inferior integrada: nome do personagem + anime */}
        <div className="bg-[#0b0b14]/90 border-t border-white/20 p-4">
          <h3 className="text-white font-bold text-xl tracking-tight leading-snug">{character.name.full}</h3>
          <p className="text-[#cbd5e1] text-sm mt-1.5 leading-snug">{animeTitle}</p>
        </div>
      </div>
    </RarityFrame>
  )
}
