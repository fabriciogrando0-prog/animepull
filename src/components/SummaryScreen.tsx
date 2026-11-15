import { motion } from 'framer-motion'
import type { Character } from './RarityBadge'
import { RARITY_COLORS, getHighestRarity } from './RarityBadge'
import { RarityFrame } from './RarityFrame'

interface SummaryScreenProps {
  cards: Character[]
  onOpenAnother: () => void
  onClose: () => void
}

export function SummaryScreen({ cards, onOpenAnother, onClose }: SummaryScreenProps) {
  const highestRarity = getHighestRarity(cards)
  const rarityColors = RARITY_COLORS[highestRarity]
  const glowColor = rarityColors.primary

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.98)' }}
    >
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, ${glowColor}20 0%, transparent 70%)`,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-7xl"
      >
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black uppercase tracking-widest mb-4"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary}, #fff)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Pack Aberto!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-300"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {highestRarity} Pull Detectado!
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pb-4 px-4"
        >
          <div className="flex flex-wrap gap-[2.72%] px-[2.72%] w-full max-w-6xl mx-auto">
            {cards.map((card, index) => {
              const rarity = card.rarity || 'Comum'
              const colors = RARITY_COLORS[rarity]
              const isHighRarity = ['Épico', 'Lendário', 'Mítico'].includes(rarity)
              const sourceAnime = card.media.nodes.find(m => m.type === 'ANIME')
              const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'

              return (
                <motion.div
                  key={`${card.id}-${index}`}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="min-w-0 w-full md:flex-none md:w-[16%] max-w-xs"
                >
                  <RarityFrame rarity={rarity}>
                    <div className="flex flex-col h-full">
                      {isHighRarity && (
                        <div className="absolute inset-0 overflow-hidden rounded-t-2xl pointer-events-none" style={{
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
                      <div className="relative w-full h-5/6 overflow-hidden">
                      <img
                        src={card.image.large}
                        alt={card.name.full}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
                        <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                          ❤ {card.favourites.toLocaleString()}
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
                        {card.name.full}
                        {card.name.native && (
                          <span className="text-xs font-normal text-gray-300 block">
                            {card.name.native}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-300 mt-auto flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {animeTitle}
                      </p>
                    </div>
                  </div>
                </RarityFrame>
              </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto"
        >
          <motion.button
            onClick={onOpenAnother}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-8 py-4 rounded-xl font-semibold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              boxShadow: `0 0 30px ${glowColor}60, 0 10px 30px rgba(0,0,0,0.3)`,
            }}
          >
            Abrir Outro Pack
          </motion.button>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-8 py-4 rounded-xl font-semibold text-gray-300 border border-gray-600 hover:border-gray-400 hover:bg-gray-800 transition-all"
          >
            Fechar
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
