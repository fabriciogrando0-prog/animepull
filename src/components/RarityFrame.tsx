import { useState } from 'react'
import type { Rarity } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'

const FRAME_BY_RARITY: Record<Rarity, string> = {
  Comum: 'comum',
  Incomum: 'incomum',
  Raro: 'raro',
  Épico: 'epico',
  Lendário: 'lendario',
  Mítico: 'mitico',
}

interface RarityFrameProps {
  rarity: Rarity
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function RarityFrame({ rarity, children, className, style }: RarityFrameProps) {
  const [frameFailed, setFrameFailed] = useState(false)
  const file = FRAME_BY_RARITY[rarity]
  const borderColor = RARITY_COLORS[rarity].primary

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '2/3',
    ...style,
  }

  return (
    <div className={className} style={containerStyle}>
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
        style={{
          position: 'absolute',
          left: '-16.6667%',
          top: '-16.6667%',
          width: '133.3333%',
          height: '133.3333%',
          maxWidth: 'none',
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'block',
        }}
      />
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
