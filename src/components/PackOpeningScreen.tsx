import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character, Rarity } from './RarityBadge'
import { RARITY_COLORS, getHighestRarity } from './RarityBadge'
import { FlipCard } from './FlipCard'
import { Particle } from './Particle'

interface PackOpeningScreenProps {
  cards: Character[]
  onComplete: () => void
  onCancel: () => void
  onCardFlipped?: (index: number) => void
}

export function PackOpeningScreen({
  cards,
  onComplete,
  onCancel,
  onCardFlipped,
}: PackOpeningScreenProps) {
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'tearing' | 'exploding' | 'revealing' | 'complete'>('idle')
  const [particles, setParticles] = useState<Array<{ x: number; y: number; color: string; size: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const highestRarity = getHighestRarity(cards)
  const rarityColors = RARITY_COLORS[highestRarity]

  const rarityGlowColors: Record<Rarity, string> = {
    Comum: '#9ca3af',
    Incomum: '#22c55e',
    Raro: '#3b82f6',
    Épico: '#a855f7',
    Lendário: '#fbbf24',
    Mítico: '#f43f5e',
  }

  const glowColor = rarityGlowColors[highestRarity]

  useEffect(() => {
    const sequence = async () => {
      setPhase('shaking')
      await new Promise(r => setTimeout(r, 500))

      setPhase('tearing')
      await new Promise(r => setTimeout(r, 400))

      setPhase('exploding')
      const centerX = containerRef.current?.getBoundingClientRect().width ? containerRef.current.getBoundingClientRect().width / 2 : 200
      const centerY = containerRef.current?.getBoundingClientRect().height ? containerRef.current.getBoundingClientRect().height / 2 : 250

      const newParticles: Array<{ x: number; y: number; color: string; size: number }> = []
      const particleCount = 60
      for (let i = 0; i < particleCount; i++) {
        const colors = [glowColor, rarityColors.primary, rarityColors.secondary, '#fff']
        newParticles.push({
          x: centerX,
          y: centerY,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 12
        })
      }
      setParticles(newParticles)

      await new Promise(r => setTimeout(r, 800))

      setPhase('revealing')
      await new Promise(r => setTimeout(r, 1200))

      setPhase('complete')
    }
    sequence()
  }, [cards, glowColor, rarityColors.primary, rarityColors.secondary])

  if (phase === 'idle') return null

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.95)' }}
    >
      <AnimatePresence mode="wait">
        {(phase === 'shaking' || phase === 'tearing' || phase === 'exploding') && (
          <motion.div
            key="pack-tearing"
            initial={{ scale: 1, rotate: 0 }}
            animate={phase === 'shaking' ? {
              rotate: [0, -5, 5, -5, 5, 0],
              scale: [1, 1.02, 1]
            } : phase === 'tearing' ? {
              rotate: [0, -8, 8, -8, 0],
              scale: [1, 1.1, 0.95, 1.15],
              skewX: [0, 5, -5, 0],
            } : {
              scale: [1.15, 2.5],
              rotate: [0, 0],
              opacity: [1, 0],
            }}
            transition={{
              duration: phase === 'shaking' ? 0.5 : phase === 'tearing' ? 0.4 : 0.6,
              ease: phase === 'exploding' ? 'easeIn' : 'easeInOut',
            }}
            style={{ transformOrigin: 'center bottom', zIndex: 10 }}
            className="relative w-72 h-96 sm:w-80 sm:h-112"
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
              background: 'linear-gradient(145deg, #0a0a12 0%, #121220 30%, #1a1a2e 60%, #0f0f1a 100%)',
              boxShadow: `0 0 60px ${glowColor}60, 0 30px 60px rgba(0,0,0,0.6)`,
              border: '2px solid',
              borderImage: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary}) 1`,
              transformStyle: 'preserve-3d',
            }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <svg width="100" height="100" viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 30px ${glowColor})` }}>
                  <defs>
                    <linearGradient id="tearStar" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={rarityColors.primary} />
                      <stop offset="50%" stopColor={rarityColors.secondary} />
                      <stop offset="100%" stopColor={glowColor} />
                    </linearGradient>
                    <filter id="tearGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g filter="url(#tearGlow)">
                    <polygon points="60,12 73,46 108,52 81,78 88,112 60,95 32,112 39,78 12,52 47,46"
                      fill="url(#tearStar)" stroke="#fff" strokeWidth="3" />
                    <circle cx="60" cy="60" r="18" fill="rgba(255,255,255,0.2)" stroke={glowColor} strokeWidth="2" />
                    <text x="60" y="66" fontSize="24" fontWeight="bold" fill="#fff" textAnchor="middle" fontFamily="system-ui" style={{ textShadow: `0 0 10px ${glowColor}` }}>
                      ★
                    </text>
                  </g>
                </svg>
                <p className="mt-6 text-2xl sm:text-3xl font-black uppercase tracking-widest text-white" style={{
                  background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary}, #fff)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  ANIMEPULL
                </p>
              </div>
              {phase === 'tearing' && (
                <motion.svg
                  className="absolute inset-0"
                  viewBox="0 0 320 448"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 20px ${glowColor})` }}
                >
                  <defs>
                    <linearGradient id="tearLine" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={glowColor} stopOpacity={0} />
                      <stop offset="50%" stopColor={glowColor} stopOpacity={1} />
                      <stop offset="100%" stopColor={rarityColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M160,0 Q180,80 160,160 Q140,240 160,320 Q180,400 160,448"
                    stroke="url(#tearLine)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M160,0 Q140,80 160,160 Q180,240 160,320 Q140,400 160,448"
                    stroke="url(#tearLine)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    style={{ opacity: 0.7 }}
                  />
                </motion.svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'exploding' && (
          <motion.div
            key="explosion"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3], opacity: [1, 0] }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${glowColor} 0%, ${rarityColors.primary} 40%, ${rarityColors.secondary} 70%, transparent 100%)`,
              boxShadow: `0 0 200px ${glowColor}, 0 0 400px ${rarityColors.primary}`,
              width: '200px', height: '200px',
              zIndex: 20,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'exploding' && (
          <>
            {particles.map((particle, i) => (
              <Particle
                key={i}
                x={particle.x}
                y={particle.y}
                color={particle.color}
                size={particle.size}
                delay={i * 0.01}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === 'revealing' || phase === 'complete') && (
          <motion.div
            key="cards-reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-30 w-full overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
            style={{ perspective: 1000 }}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-max" style={{ transformStyle: 'preserve-3d' }}>
              {cards.map((card, index) => (
                <FlipCard
                  key={`${card.id}-${index}`}
                  character={card}
                  index={index}
                  delay={index}
                  onFlipped={() => onCardFlipped?.(index)}
                />
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 text-center w-full"
            >
              <p className="text-lg font-semibold text-white mb-2" style={{
                background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {highestRarity} Pull Detectado!
              </p>
              <p className="text-gray-400 text-sm">Clique em qualquer card para virar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4"
        >
          <button
            onClick={onComplete}
            className="px-8 py-3 rounded-xl font-semibold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${glowColor}, ${rarityColors.primary})`,
              boxShadow: `0 0 30px ${glowColor}60`
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Ver Cards
          </button>
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-xl font-semibold text-gray-300 border border-gray-600 hover:border-gray-400 hover:bg-gray-800 transition-all"
          >
            Abrir Outro
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
