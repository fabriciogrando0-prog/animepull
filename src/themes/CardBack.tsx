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
  const src = `${import.meta.env.BASE_URL}packs/${t.arquivo}`
  const dark = darker(C.surface, 0.5)

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center"
      style={{
        position: 'absolute',
        inset: '0',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: `linear-gradient(180deg, ${C.surface}, ${dark})`,
        border: `5px solid ${C.accent}`,
        outline: `1px solid ${C.accent}`,
        outlineOffset: '-6px',
        transformStyle: 'preserve-3d',
      }}
    >
      <img
        src={src}
        alt={`Verso do pack ${t.name}`}
        draggable={false}
        className="max-h-[70%] w-auto object-contain mb-4"
        style={{ userSelect: 'none' }}
      />
      <p style={{ color: C.text, opacity: 0.7, fontWeight: '700', margin: 0 }}>
        Clique para revelar
      </p>
    </div>
  )
}
