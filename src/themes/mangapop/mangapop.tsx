import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Theme } from '../types'

const IMG_SRC = import.meta.env.BASE_URL + 'manga-pop-pack-transparent.png'

const C = {
  bg: '#ffd60a',
  surface: '#fff7c2',
  accent: '#ff2e93',
  accent2: '#1ec8ff',
  text: '#111111',
  muted: '#e6c208',
} as const

const packSize = {
  height: 'min(62vh, 560px)',
  width: 'auto',
} as const

const shadow = 'drop-shadow(0 18px 24px rgba(0,0,0,0.5))'

export function PackArt({ onClick }: { onClick: () => void }) {
  const [error, setError] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mx, setMx] = useState(0)
  const [my, setMy] = useState(0)

  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
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

  return (
    <motion.button
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setHovered(true)}
      whileTap={{ scale: 0.98 }}
      style={{
        ...packSize,
        userSelect: 'none',
        filter,
        transition: 'filter 0.2s ease',
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        display: 'inline-block',
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
                ...packSize,
                background: '#ffd60a',
                color: '#111111',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.5rem',
                userSelect: 'none',
              }}
            >
              Manga Pop
            </div>
          ) : (
            <img
              src={IMG_SRC}
              alt="Arte do pack Manga Pop"
              draggable={false}
              onError={() => setError(true)}
              style={{
                width: 'auto',
                height: '100%',
                display: 'block',
                userSelect: 'none',
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.button>
  )
}

export const mangapopTheme: Theme = {
  id: 'mangapop',
  name: 'Manga pop',
  palette: C,
  PackArt,
}
