import { useTheme } from './ThemeContext'
import type { Theme } from './types'

function darker(hex: string, factor: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const n = parseInt(h, 16)
  const r = Math.floor(((n >> 16) & 0xff) * factor)
  const g = Math.floor(((n >> 8) & 0xff) * factor)
  const b = Math.floor((n & 0xff) * factor)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`
}

export function CardBack({ theme }: { theme?: Theme } = {}) {
  const ctx = useTheme()
  const t = theme || ctx.theme
  const C = t.palette
  const src = `${import.meta.env.BASE_URL}versos/${t.verso}`
  const dark = darker(C.surface, 0.5)

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        position: 'absolute',
        inset: '0',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: `linear-gradient(180deg, ${C.surface}, ${dark})`,
        border: `5px solid ${C.accent}`,
        transformStyle: 'preserve-3d',
      }}
    >
      <img
        src={src}
        alt={`Verso do pack ${t.name}`}
        draggable={false}
        className="w-full h-full object-cover object-center"
        style={{ userSelect: 'none', display: 'block' }}
      />
    </div>
  )
}
