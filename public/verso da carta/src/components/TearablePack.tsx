import { useCallback, useEffect, useRef, useState } from 'react'
import { Particle } from './Particle'
import type { Rarity } from './RarityBadge'

const PACK_HEIGHT = 'min(55vh, 520px)'
const TEAR_Y = 0.065
const TEETH_COUNT = 24
const TOOTH_HEIGHT = 0.012

const RARITY_COLOR: Record<Rarity, string> = {
  Comum: '#ffffff',
  Incomum: '#22c55e',
  Raro: '#3b82f6',
  Épico: '#a855f7',
  Lendário: '#fbbf24',
  Mítico: '#f43f5e',
}

const PARTICLE_COUNT: Record<Rarity, number> = {
  Comum: 30,
  Incomum: 30,
  Raro: 30,
  Épico: 30,
  Lendário: 30,
  Mítico: 50,
}

interface TearablePackProps {
  src: string
  rarity: Rarity
  onTearComplete: () => void
  paused?: boolean
  effectsEnabled?: boolean
  startSignal?: boolean
}

function toPct(v: number): string {
  return `${(v * 100).toFixed(4)}%`
}

function tearLine(y: number): [number, number][] {
  const pts: [number, number][] = [[0, y]]
  const steps = TEETH_COUNT * 2
  for (let i = 1; i <= steps; i++) {
    const x = i / steps
    const off = i % 2 === 1 ? -TOOTH_HEIGHT : TOOTH_HEIGHT
    pts.push([x, y + off])
  }
  pts.push([1, y])
  return pts
}

function fmt(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${toPct(x)} ${toPct(y)}`).join(', ')
}

const topTeeth = tearLine(TEAR_Y).slice(1).reverse()
const CLIP_TOP = `polygon(${toPct(0)} ${toPct(0)}, ${toPct(1)} ${toPct(0)}, ${toPct(1)} ${toPct(TEAR_Y)}, ${fmt(topTeeth)}, ${toPct(0)} ${toPct(0)})`
const CLIP_BOTTOM = `polygon(${fmt(tearLine(TEAR_Y))}, ${toPct(1)} ${toPct(1)}, ${toPct(0)} ${toPct(1)})`

const BASE_IMG: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  userSelect: 'none',
}

export function TearablePack({
  src,
  rarity,
  onTearComplete,
  paused: pausedProp = false,
  effectsEnabled = true,
  startSignal,
}: TearablePackProps) {
  const color = RARITY_COLOR[rarity]
  const count = PARTICLE_COUNT[rarity]
  const [started, setStarted] = useState(false)
  const [exploding, setExploding] = useState(false)
  const hiddenRef = useRef(pausedProp)

  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.visibilityState === 'hidden'
    }
    onVis()
    window.addEventListener('visibilitychange', onVis)
    return () => window.removeEventListener('visibilitychange', onVis)
  }, [])

  const isPaused = pausedProp || hiddenRef.current
  const playState = isPaused ? 'paused' : 'running'

  const start = useCallback(() => {
    if (!started) setStarted(true)
  }, [started])

  useEffect(() => {
    if (startSignal) start()
  }, [startSignal, start])

  const packRef = useRef<HTMLDivElement>(null)
  const packWidthRef = useRef(0)
  const startXRef = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const justDraggedRef = useRef(false)

  const stripPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isPaused || started) return
    justDraggedRef.current = false
    const rect = packRef.current?.getBoundingClientRect()
    if (!rect) return
    packWidthRef.current = rect.width
    startXRef.current = e.clientX - rect.left
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    setDragX(startXRef.current)
  }, [isPaused, started])

  const stripPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const rect = packRef.current?.getBoundingClientRect()
    if (!rect) return
    packWidthRef.current = rect.width
    setDragX(e.clientX - rect.left)
  }, [dragging])

  const stripPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    const rect = packRef.current?.getBoundingClientRect()
    const width = rect ? rect.width : packWidthRef.current || 1
    const dx = Math.abs((rect ? e.clientX - rect.left : dragX) - startXRef.current)
    const progress = dx / width
    setDragging(false)
    if (dx < 8) {
      start()
    } else if (progress >= 0.7) {
      justDraggedRef.current = true
      start()
    } else {
      setDragX(startXRef.current)
      justDraggedRef.current = true
    }
  }, [dragging, start, dragX])

  const stripPointerCancel = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    setDragX(startXRef.current)
    justDraggedRef.current = true
  }, [dragging])

  const onPackClick = useCallback(() => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false
      return
    }
    start()
  }, [start])

  useEffect(() => {
    if (!started) return
    const particlesT = setTimeout(() => setExploding(true), 560)
    const endT = setTimeout(() => {
      onTearComplete()
    }, 1150)
    return () => {
      clearTimeout(particlesT)
      clearTimeout(endT)
    }
  }, [started, onTearComplete])

  const packWidth = Math.max(packWidthRef.current, 1)
  const dragDX = dragX - startXRef.current
  const tilt = dragging ? Math.sign(dragDX) * Math.min(Math.abs(dragDX) / packWidth, 1) * 6 : 0

  const packStyle: React.CSSProperties = {
    height: PACK_HEIGHT,
    display: 'inline-block',
    position: 'relative',
    userSelect: 'none',
    cursor: 'pointer',
    animation: started ? 'none' : 'float-pack 3s ease-in-out infinite',
    animationPlayState: playState,
  }

  const squeezeStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    animation: 'pack-squeeze 0.15s ease-out forwards',
    animationPlayState: playState,
  }

  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: toPct(TEAR_Y),
    width: '100%',
    height: '4px',
    transform: 'translateX(-50%) scaleX(0)',
    transformOrigin: '50% 50%',
    background: color,
    boxShadow: `0 0 10px ${color}, 0 0 24px ${color}80`,
    pointerEvents: 'none',
    animation: started ? 'light-line 0.35s ease-out 0.15s forwards' : 'none',
    animationPlayState: playState,
  }

  const innerLightStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: toPct(TEAR_Y),
    width: '100%',
    height: '14%',
    background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)`,
    pointerEvents: 'none',
    animation: started ? 'inner-light 0.35s ease-out 0.15s forwards' : 'none',
    animationPlayState: playState,
  }

  const beamsStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `repeating-conic-gradient(from 0deg at 50% ${toPct(TEAR_Y)}, ${color}0a 0deg 3deg, transparent 3deg 10deg)`,
    opacity: started ? 0.16 : 0,
    pointerEvents: 'none',
    animation: started ? 'beams-fade 0.4s ease-out 0.5s forwards' : 'none',
    animationPlayState: playState,
  }

  const stripStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '18%',
    touchAction: 'none',
    cursor: dragging ? 'grabbing' : 'grab',
    zIndex: 4,
  }

  const dragLineStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${Math.min(Math.max(dragX, 0), packWidthRef.current || 0)}px`,
    top: toPct(TEAR_Y),
    width: '10px',
    height: '16%',
    transform: 'translate(-50%, -50%)',
    background: color,
    boxShadow: `0 0 8px ${color}, 0 0 20px ${color}80`,
    clipPath: 'polygon(50% 0%, 72% 30%, 28% 30%, 72% 70%, 28% 70%, 50% 100%)',
    zIndex: 3,
    pointerEvents: 'none',
  }

  const topStyle: React.CSSProperties = {
    ...BASE_IMG,
    clipPath: CLIP_TOP,
    zIndex: 2,
    transform: dragging ? `rotate(${tilt}deg)` : 'none',
    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    animation: started ? 'pack-top-fly 0.4s ease-in 0.5s forwards' : 'none',
    animationPlayState: playState,
  }

  const bottomStyle: React.CSSProperties = {
    ...BASE_IMG,
    clipPath: CLIP_BOTTOM,
    zIndex: 1,
    animation: started ? 'pack-body-drop 0.6s ease-out 0.5s forwards' : 'none',
    animationPlayState: playState,
  }

  return (
    <div
      className="tearable-pack"
      style={packStyle}
      onClick={onPackClick}
      role="button"
      tabIndex={0}
    >
      <img src={src} alt="" style={{ visibility: 'hidden', height: '100%', width: 'auto', display: 'block' }} aria-hidden="true" />
      <div
        ref={packRef}
        style={stripStyle}
        onPointerDown={stripPointerDown}
        onPointerMove={stripPointerMove}
        onPointerUp={stripPointerUp}
        onPointerCancel={stripPointerCancel}
      />
      <div style={squeezeStyle}>
        <div
          className="tear-piece"
          style={{
            ...bottomStyle,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {started && (
            <div style={innerLightStyle} />
          )}
        </div>
        <div
          className="tear-piece"
          style={{
            ...topStyle,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: exploding ? 0 : 1, transition: 'opacity 0.25s ease-out' }}>
          <div style={lineStyle} />
          <div style={beamsStyle} />
        </div>
        {dragging && <div style={dragLineStyle} />}
        {exploding && effectsEnabled && !isPaused && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: toPct(TEAR_Y),
              transform: 'translate(-50%, -50%)',
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <Particle
                key={i}
                x={0}
                y={0}
                color={color}
                size={4 + (rarity === 'Mítico' ? 2 : 0)}
                delay={i * 0.018}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
