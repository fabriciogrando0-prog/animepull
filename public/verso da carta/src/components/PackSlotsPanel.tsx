import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { CardBack } from './CardFront'
import { motion } from 'framer-motion'
import { useTheme } from '../themes/ThemeContext'

interface PackSlotsPanelProps {
  cards: (Character | null)[]
  collection: Character[]
  className?: string
  slotRefs?: (HTMLDivElement | null)[]
  animate?: boolean
}

export function PackSlotsPanel({ cards, collection, className, slotRefs, animate = true }: PackSlotsPanelProps) {
  const { theme } = useTheme()
  const surface = theme.palette.surface
  const accent = theme.palette.accent
  const distinct = new Set(collection.map(c => c.id)).size

  return (
    <section
      className={`w-full shrink-0 rounded-2xl p-4 flex flex-col items-center gap-4 lg:justify-between ${className ?? ''}`}
      style={{
        backgroundColor: `${surface}66`,
        border: `1px solid ${accent}4d`,
      }}
    >
      <div className="grid grid-cols-2 gap-2 w-full">
        {[0, 1, 2, 3, 4].map((i) => {
          const card = cards[i]
          const filled = !!card
          const rarity = (card?.rarity || 'Comum') as keyof typeof RARITY_COLORS
          const colors = RARITY_COLORS[rarity]
          const sourceAnime = card?.media.nodes.find(m => m.type === 'ANIME')
          const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || ''

          return (
            <div
              key={i}
              ref={(el) => { if (slotRefs) slotRefs[i] = el || null }}
              className="relative overflow-hidden rounded-xl aspect-[2/3]"
              style={{
                border: filled ? `1px solid ${colors.primary}` : `1px solid ${accent}33`,
                backgroundColor: filled ? undefined : `${surface}80`,
              }}
            >
              {filled ? (
                animate ? (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col h-full"
                  >
                    <img
                      src={card.image.large}
                      alt={card.name.full}
                      className="w-full h-[5/6] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/40">
                      <div className="text-[10px] font-semibold line-clamp-1 text-white">
                        {card.name.full}
                      </div>
                      {animeTitle && (
                        <div className="text-[9px] text-gray-300/90 line-clamp-1">
                          {animeTitle}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col h-full">
                    <img
                      src={card.image.large}
                      alt={card.name.full}
                      className="w-full h-[5/6] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/40">
                      <div className="text-[10px] font-semibold line-clamp-1 text-white">
                        {card.name.full}
                      </div>
                      {animeTitle && (
                        <div className="text-[9px] text-gray-300/90 line-clamp-1">
                          {animeTitle}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <CardBack />
              )}
            </div>
          )
        })}
      </div>

      <div
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
        style={{
          backgroundColor: `${surface}bf`,
          borderColor: `${accent}80`,
          color: theme.palette.text,
        }}
      >
        <span>Coleção:</span>
        <span>{distinct.toLocaleString('pt-BR')}</span>
      </div>
    </section>
  )
}
