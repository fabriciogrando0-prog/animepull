import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { CardFront, CardBack } from './CardFront'

interface FlipCardProps {
  character: Character
  index: number
  delay?: number
  onFlipped?: () => void
}

export function FlipCard({ character, index, delay = 0, onFlipped }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [revealEffect, setRevealEffect] = useState(false)
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]
  const rarityColor = colors.primary

  const handleClick = () => {
    if (!flipped) {
      setFlipped(true)
      setRevealEffect(true)
      setTimeout(() => setRevealEffect(false), 2000)
      onFlipped?.()
    }
  }

  const isHighRarity = ['Épico', 'Lendário', 'Mítico'].includes(rarity)
  const isMythic = rarity === 'Mítico'
  const isLegendary = rarity === 'Lendário'
  const isEpic = rarity === 'Épico'
  const isRare = rarity === 'Raro'

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, zIndex: 5 - index }}
      animate={{ scale: 1, opacity: 1, zIndex: flipped ? 10 : 5 - index }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className="relative w-72 aspect-[2/3] sm:w-80 aspect-[2/3] cursor-pointer flex-shrink-0 snap-center"
      onClick={handleClick}
    >
      <AnimatePresence>
        {revealEffect && isMythic && (
          <motion.div
            key="mythic-flash"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 2.5, 4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${rarityColor} 0%, ${colors.secondary} 30%, transparent 70%)`,
              zIndex: 50,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isLegendary && (
          <motion.div
            key="legendary-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(circle, ${rarityColor} 0%, ${colors.secondary} 40%, transparent 70%)`,
              boxShadow: `0 0 150px ${rarityColor}, 0 0 300px ${colors.secondary}`,
              zIndex: 20,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isLegendary && (
          <motion.div
            key="legendary-shake"
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 25 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isEpic && (
          <>
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`epic-particle-${i}`}
                initial={{ x: 0, y: 0, scale: 0.5, opacity: 1, rotate: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  scale: [1, 0],
                  rotate: (Math.random() - 0.5) * 720,
                  opacity: 0
                }}
                transition={{ duration: 1, delay: i * 0.02, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 6 + Math.random() * 10,
                  height: 6 + Math.random() * 10,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${rarityColor}, ${colors.secondary})`,
                  boxShadow: `0 0 20px ${rarityColor}`,
                  pointerEvents: 'none',
                  zIndex: 25,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealEffect && isRare && (
          <motion.div
            key="rare-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 0] }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: `0 0 100px ${rarityColor}80, inset 0 0 100px ${rarityColor}40`,
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          rotateY: flipped ? 180 : 0,
          scale: isMythic && flipped ? 1.15 : 1,
        }}
        transition={{
          duration: 0.7,
          ease: [0.25, 0.46, 0.45, 0.94],
          scale: { duration: 0.5, delay: 0.35 },
        }}
        style={{
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
        }}
        className="absolute inset-0"
      >
        <CardFront character={character} isHighRarity={isHighRarity} />
        <CardBack />
      </motion.div>

      {flipped && isMythic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 60px ${rarityColor}, 0 0 120px ${colors.secondary}, inset 0 0 60px ${rarityColor}40`,
            border: `2px solid ${rarityColor}`,
            animation: 'pulse-glow 1s ease-in-out infinite',
            zIndex: 5,
          }}
        />
      )}
    </motion.div>
  )
}
