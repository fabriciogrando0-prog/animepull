import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Character, Rarity } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { RarityFrame } from './RarityFrame'
import { CardBack } from './CardFront'

const RARITY_ORDER: Rarity[] = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico']
const CARD_HEIGHT = 'min(72vh, 640px)'

interface StackPhaseProps {
  cards: Character[]
  onSave: (card: Character) => void
  onReveal: (card: Character, index: number) => void
  onComplete: () => void
}

const RARITY_RGB: Record<Rarity, string> = {
  Comum: '255, 255, 255',
  Incomum: '34, 197, 94',
  Raro: '59, 130, 246',
  Épico: '168, 85, 247',
  Lendário: '251, 191, 36',
  Mítico: '244, 63, 94',
}

export function StackPhase({ cards, onSave, onReveal, onComplete }: StackPhaseProps) {
  const ordered = [...cards].sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity || 'Comum') - RARITY_ORDER.indexOf(b.rarity || 'Comum')
  )
  const [stackIndex, setStackIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const current = ordered[stackIndex]
  const rarity = (current?.rarity || 'Comum') as Rarity
  const colors = RARITY_COLORS[rarity]
  const isLast = stackIndex >= ordered.length - 1
  const isMythic = rarity === 'Mítico'
  const isLegendary = rarity === 'Lendário'
  const isEpic = rarity === 'Épico'
  const isRare = rarity === 'Raro'

  const seedRot = (i: number) => ((i * 137 + 11) % 5) - 2

  const handleFlip = () => {
    if (!current || animating || saving) return
    setAnimating(true)
    setFlipped(true)
    try {
      onSave(current)
      onReveal(current, stackIndex)
    } catch {}
    setTimeout(() => setAnimating(false), 700)
  }

  const handleGuard = () => {
    if (!current || animating || saving) return
    setAnimating(true)
    setSaving(true)
    try {
      onReveal(current, stackIndex)
    } catch {}
    setTimeout(() => {
      setSaving(false)
      setAnimating(false)
      advance()
    }, 600)
  }

  const advance = () => {
    if (isLast) {
      setTimeout(() => onComplete(), 700)
      return
    }
    setStackIndex(stackIndex + 1)
    setFlipped(false)
  }

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      e.preventDefault()
      if (animating || saving) return
      if (flipped) handleGuard()
      else handleFlip()
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [flipped, animating, saving, handleFlip, handleGuard])

  const doSkip = () => {
    setShowSkip(false)
    ordered.forEach((c, i) => {
      try {
        onSave(c)
        onReveal(c, i)
      } catch {}
    })
    onComplete()
  }

  const animeNode = current.media.nodes.find((m) => m.type === 'ANIME')
  const animeTitle = animeNode?.title.english || animeNode?.title.romaji || ''

  const front = (
    <RarityFrame rarity={rarity}>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={current.image.large}
            alt={current.name.full}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60">
            <div className="text-white font-bold text-sm leading-tight">{current.name.full}</div>
            {animeTitle && <div className="text-gray-300 text-xs mt-0.5">{animeTitle}</div>}
          </div>
        </div>
      </div>
    </RarityFrame>
  )

  const stackSize: React.CSSProperties = {
    width: '100%',
    maxWidth: 340,
    aspectRatio: '2/3',
    maxHeight: CARD_HEIGHT,
    perspective: 1000,
    transformStyle: 'preserve-3d',
  }

  return (
    <section className="relative flex-1 w-full flex items-center justify-center">
      {isMythic && flipped && (
        <div
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{
            background: `rgb(${RARITY_RGB[rarity]})`,
            animation: 'flash 600ms ease-in-out',
          } as React.CSSProperties}
        />
      )}
      <div className="absolute inset-0" style={{ background: isMythic && flipped ? 'rgba(0,0,0,0.45)' : 'transparent' }} />
      <div className="flex flex-col items-center gap-4 w-full max-w-[460px] mx-auto px-4 z-[20]">
          <div className="relative w-full max-w-[340px] flex flex-col items-center justify-center gap-3">
          {ordered
            .map((_, i) => i)
            .filter((i) => i < stackIndex)
            .sort((a, b) => b - a)
            .map((i) => (
              <motion.div
                key={`back-${i}`}
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                className="absolute"
                style={{
                  ...stackSize,
                  zIndex: i,
                  transform: `rotate(${seedRot(i)}deg) translate(${i % 2 === 0 ? -6 : 6}px, 6px)`,
                  opacity: 0.6,
                  pointerEvents: 'none',
                } as React.CSSProperties}
              >
                <CardBack />
              </motion.div>
            ))}
          <motion.div
            ref={cardRef}
            key={`card-${stackIndex}`}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: stackIndex * 0.06, ease: 'easeOut' }}
            className="relative z-10 cursor-pointer select-none"
            role="button"
            tabIndex={0}
            onClick={() => (flipped ? handleGuard() : handleFlip())}
            onKeyDown={(e) => {
              if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault()
                flipped ? handleGuard() : handleFlip()
              }
            }}
            style={{
              ...stackSize,
              perspective: 1000,
              transformStyle: 'preserve-3d',
              zIndex: 20,
            } as React.CSSProperties}
          >
            <motion.div
              animate={{
                rotateY: flipped ? 180 : 0,
                scale: isMythic && flipped ? 1.08 : 1,
              }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transformStyle: 'preserve-3d', height: '100%' }}
              >
                <CardBack />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  transformStyle: 'preserve-3d',
                  height: '100%',
                }}
              >
                {front}
              </div>
            </motion.div>
          </motion.div>
          {flipped && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
              {isRare && (
                <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 100px ${colors.primary}80, inset 0 0 100px ${colors.primary}40`, pointerEvents: 'none' }} />
              )}
              {isEpic && (
                <>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <motion.div
                      key={`epic-${i}`}
                      initial={{ x: 0, y: 0, scale: 0.5, opacity: 1, rotate: 0 }}
                      animate={{
                        x: (Math.random() - 0.5) * 260,
                        y: (Math.random() - 0.5) * 260,
                        scale: [1, 0],
                        rotate: (Math.random() - 0.5) * 720,
                        opacity: 0,
                      }}
                      transition={{ duration: 1, delay: i * 0.02, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', left: '50%', top: '50%',
                        width: 6 + Math.random() * 10, height: 6 + Math.random() * 10, borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
                        boxShadow: `0 0 20px ${colors.primary}`, pointerEvents: 'none', zIndex: 30,
                        transform: 'translate(-50%, -50%)',
                      } as React.CSSProperties}
                    />
                  ))}
                </>
              )}
              {isLegendary && (
                <>
                  <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 150px ${colors.primary}, 0 0 300px ${colors.secondary}`, pointerEvents: 'none' }} />
                  <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 35 }}
                    animate={{ x: [0, -8, 8, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }} />
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowSkip(true)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-600 rounded hover:bg-gray-800 transition"
          >
            Pular
          </button>
        </div>
        <p className="text-gray-300 text-sm text-center">
          {isLast ? 'A última carta...' : 'Toque na carta para virar (Espaço)'}
          {flipped && !isLast ? ' - Toque para guardar (Espaço)' : ''}
        </p>
      </div>
      {showSkip && (
        <div className="fixed inset-0 z-[50000] flex items-center justify-center bg-black/80" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#0b0b14] border border-gray-700 p-6 rounded-2xl text-center max-w-sm mx-4">
            <p className="text-white mb-4">Tem certeza? Isso revela todas as cartas e vai ao resumo.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowSkip(false)} className="px-4 py-1.5 text-gray-300 hover:text-white">Cancelar</button>
              <button onClick={doSkip} className="px-4 py-1.5 text-white bg-[var(--accent)] rounded hover:opacity-90">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
