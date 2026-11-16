import { useEffect, useState } from 'react'
import type { Rarity } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { FrameFX } from './FrameFX'
import { useEffects } from './EffectsContext'

const FRAME_BY_RARITY: Record<Rarity, string> = {
  Comum: 'comum',
  Incomum: 'incomum',
  Raro: 'raro',
  Épico: 'epico',
  Lendário: 'lendario',
  Mítico: 'mitico',
}

interface Pulse {
  gmin: number
  gmax: number
  dur: number
  opacity?: boolean
  hue?: boolean
}

const PULSE_BY_RARITY: Record<Rarity, Pulse | null> = {
  Comum: null,
  Incomum: { gmin: 6, gmax: 13, dur: 3 },
  Raro: { gmin: 6, gmax: 13, dur: 3 },
  Épico: { gmin: 8, gmax: 20, dur: 2.5, opacity: true },
  Lendário: { gmin: 10, gmax: 28, dur: 2 },
  Mítico: { gmin: 12, gmax: 34, dur: 1.5, hue: true },
}

interface RarityFrameProps {
  rarity: Rarity
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  intensity?: number
}

export function RarityFrame({ rarity, children, className, style, intensity = 1 }: RarityFrameProps) {
  const { enabled } = useEffects()
  const [frameFailed, setFrameFailed] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)
  const file = FRAME_BY_RARITY[rarity]
  const borderColor = RARITY_COLORS[rarity].primary
  const pulse = PULSE_BY_RARITY[rarity]

  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  const paused = !enabled || hidden ? 'paused' : 'running'

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '2/3',
    ...style,
  }

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    left: '-16.6667%',
    top: '-16.6667%',
    width: '133.3333%',
    height: '133.3333%',
    maxWidth: 'none',
    pointerEvents: 'none',
    userSelect: 'none',
    display: 'block',
    animationPlayState: paused,
    ...(pulse
      ? {
          animation: pulse.hue
            ? 'frame-pulse-hue 6s infinite alternate ease-in-out'
            : pulse.opacity
              ? `frame-pulse ${pulse.dur}s infinite alternate ease-in-out, frame-opacity 4s infinite alternate ease-in-out`
              : `frame-pulse ${pulse.dur}s infinite alternate ease-in-out`,
          '--gmin': String(pulse.gmin),
          '--gmax': String(pulse.gmax),
          '--gcolor': borderColor,
        }
      : { animation: 'none' }),
  }

  return (
    <div className={className ? `${className} rarity-frame` : 'rarity-frame'} style={containerStyle}>
      <div
        style={{
          position: 'absolute',
          inset: '0',
          overflow: 'hidden',
          borderRadius: '4.7%/3.1%',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>{children}</div>
      </div>
      <img
        src={`${import.meta.env.BASE_URL}molduras/frame-${file}.webp`}
        alt=""
        draggable={false}
        onError={() => setFrameFailed(true)}
        style={imgStyle}
      />
      <FrameFX rarity={rarity} intensity={intensity} paused={!enabled || hidden} />
      {frameFailed && (
        <div
          style={{
            position: 'absolute',
            inset: '0',
            border: `4px solid ${borderColor}`,
            borderRadius: '4.7%/3.1%',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
