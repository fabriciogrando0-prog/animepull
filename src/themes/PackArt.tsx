import type { MouseEvent } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Theme } from './types'

const PACK_HEIGHT = 'min(62vh, 560px)'
const shadow = 'drop-shadow(0 18px 24px rgba(0,0,0,0.5))'

export function PackArt({ theme, onClick }: { theme: Theme; onClick: () => void }) {
  const [error, setError] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mx, setMx] = useState(0)
  const [my, setMy] = useState(0)

  const onMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setMx(((e.clientX - r.left) / r.width - 0.5) * 2)
    setMy(((e.clientY - r.top) / r.height - 0.5) * 2)
  }

  const onMouseLeave = () => {
    setMx(0)
    setMy(0)
    setHovered(false)
  }

  const filter = hovered ? `${shadow} brightness(1.08)` : shadow
  const src = `${import.meta.env.BASE_URL}packs/${theme.arquivo}`

  return (
    <motion.button
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setHovered(true)}
      whileTap={{ scale: 0.98 }}
      type="button"
      style={{
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        display: 'inline-block',
        height: PACK_HEIGHT,
        width: 'auto',
        maxWidth: '90vw',
        userSelect: 'none',
        filter,
        transition: 'filter 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotateX(${-my * 8}deg) rotateY(${mx * 8}deg)`,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ userSelect: 'none', display: 'block' }}
        >
          {error ? (
            <div
              style={{
                height: PACK_HEIGHT,
                width: 'auto',
                maxWidth: '90vw',
                background: theme.palette.accent,
                color: theme.palette.text,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.5rem',
                userSelect: 'none',
              }}
            >
              {theme.name}
            </div>
          ) : (
            <img
              src={src}
              alt={`Arte do pack ${theme.name}`}
              draggable={false}
              onError={() => setError(true)}
              style={{
                width: 'auto',
                height: '100%',
                maxWidth: '90vw',
                display: 'block',
                objectFit: 'contain',
                userSelect: 'none',
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.button>
  )
}
