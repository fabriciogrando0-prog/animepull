import { useMemo } from 'react'
import type { Rarity } from './RarityBadge'

type FXKind = 'leaves' | 'sparkles' | 'orbs' | 'sparks' | 'embers'

interface FXParticle {
  x: number
  y: number
  size: number
  dx: number
  dy: number
  dur: number
  delay: number
  color: string
}

interface FrameFXProps {
  rarity: Rarity
  intensity?: number
  paused?: boolean
}

const FX_CONFIG: Record<Rarity, { kind: FXKind; baseCount: number; color: string[]; dur: [number, number]; dx: [number, number]; dy: [number, number] } | null> = {
  Comum: null,
  Incomum: { kind: 'leaves', baseCount: 8, color: ['#4ade80'], dur: [6, 9], dx: [-14, 14], dy: [45, 95] },
  Raro: { kind: 'sparkles', baseCount: 10, color: ['#93c5fd', '#ffffff'], dur: [2, 4], dx: [-7, 7], dy: [-7, 7] },
  Épico: { kind: 'orbs', baseCount: 16, color: ['#c084fc', '#e9d5ff'], dur: [5, 8], dx: [-30, 30], dy: [-110, -55] },
  Lendário: { kind: 'sparks', baseCount: 24, color: ['#fbbf24', '#fff3b0'], dur: [4, 7], dx: [-16, 16], dy: [-100, -50] },
  Mítico: { kind: 'embers', baseCount: 36, color: ['#fb7185', '#f43f5e', '#ffe4e6'], dur: [3, 6], dx: [-26, 26], dy: [-130, -70] },
}

const SIZE_BY_KIND: Record<FXKind, [number, number]> = {
  leaves: [4, 8],
  sparkles: [4, 7],
  orbs: [5, 10],
  sparks: [3, 6],
  embers: [4, 9],
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return h || 1
}

function createRng(s: string) {
  let seed = hashString(s)
  return () => {
    seed = (seed * 1664525 + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
}

function randRange(rng: () => number, [a, b]: [number, number]): number {
  return a + rng() * (b - a)
}

export function FrameFX({ rarity, intensity = 1, paused }: FrameFXProps) {
  const fx = FX_CONFIG[rarity]
  let count = fx ? Math.round(fx.baseCount * intensity) : 0
  if (rarity === 'Mítico') count = Math.min(count, 8)
  if (!fx || count <= 0) return null

  const particles = useMemo<FXParticle[]>(() => {
    const rng = createRng(`${rarity}-${intensity}`)
    const out: FXParticle[] = []
    for (let i = 0; i < count; i++) {
      const side = Math.floor(rng() * 4)
      let x: number
      let y: number
      if (side === 0) {
        x = randRange(rng, [0, 100])
        y = randRange(rng, [0, 12.5])
      } else if (side === 1) {
        x = randRange(rng, [0, 100])
        y = randRange(rng, [87.5, 100])
      } else if (side === 2) {
        x = randRange(rng, [0, 12.5])
        y = randRange(rng, [12.5, 87.5])
      } else {
        x = randRange(rng, [87.5, 100])
        y = randRange(rng, [12.5, 87.5])
      }
      out.push({
        x,
        y,
        size: randRange(rng, SIZE_BY_KIND[fx.kind]),
        dx: randRange(rng, fx.dx),
        dy: randRange(rng, fx.dy),
        dur: randRange(rng, fx.dur),
        delay: rng() * randRange(rng, fx.dur),
        color: fx.color[i % fx.color.length],
      })
    }
    return out
  }, [fx, count, rarity, intensity])

  return (
    <div
      className="frame-fx"
      style={{
        position: 'absolute',
        left: '-16.6667%',
        top: '-16.6667%',
        width: '133.3333%',
        height: '133.3333%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1,
        animationPlayState: paused ? 'paused' : 'running',
      } as React.CSSProperties}
    >
      {particles.map((p, i) => {
        const height = fx.kind === 'leaves' ? Math.round(p.size * 0.55) : p.size
        let borderRadius: string | number = 0
        if (fx.kind === 'orbs' || fx.kind === 'leaves') borderRadius = '50%'
        else if (fx.kind === 'embers') borderRadius = i % 3 === 0 ? '50%' : 0
        return (
          <div
            key={i}
            className={`fx-p fx-${fx.kind}`}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height,
              borderRadius,
              background: p.color,
              boxShadow: `0 0 ${Math.round(p.size * 2)}px ${p.color}`,
              '--size': `${p.size}px`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
              animation: `fx-${fx.kind} var(--dur) linear var(--delay) infinite`,
              animationIterationCount: 'infinite',
              willChange: 'transform, opacity',
              animationPlayState: paused ? 'paused' : 'running',
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
