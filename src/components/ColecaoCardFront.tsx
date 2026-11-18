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
      <div className="relative flex h-full w-full overflow-hidden bg-[#0b0b14]">
        <img
          src={character.image.large}
          alt={character.name.full}
          className="w-full h-full object-cover"
          decoding="async"
        />
        {/* Degradê escuro suave e transparente apenas atrás dos textos (região inferior) */}
        <div className="absolute inset-x-0 bottom-0 h-[42%] z-10 bg-gradient-to-t from-[#0b0b14] via-[#0b0b14/45] to-transparent" />
        {/* Placa lateral de destaque da raridade */}
        <div
          className="absolute inset-y-0 left-0 z-20"
          style={{
            width: '14px',
            backgroundColor: colors.primary,
          }}
        />
        {/* Selo de raridade integrado */}
        <div className="absolute top-4 left-4 z-30">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl border border-white/30"
            style={{
              backgroundColor: colors.primary,
              color: '#0b0b14',
              borderColor: colors.primary,
            }}
          >
            {rarity}
          </span>
        </div>
        {/* Nome do personagem + anime integrados sobre a imagem (região inferior) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-40">
          <h3 className="text-white font-bold text-xl tracking-tight leading-snug shadow-sm">
            {character.name.full}
          </h3>
          <p className="text-[#cbd5e1] text-sm mt-1.5 leading-snug">{animeTitle}</p>
        </div>
      </div>
    </RarityFrame>
  )
}
