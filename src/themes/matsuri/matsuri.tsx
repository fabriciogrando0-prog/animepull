import { motion } from 'framer-motion'
import type { Theme } from '../types'

const C = {
  bg: '#0d1230',
  surface: '#1a1f4a',
  accent: '#d63a2f',
  accent2: '#f0b84a',
  text: '#f6ecd9',
  muted: '#9aa5c8',
} as const

function KitsuneMask({ x = 120, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <polygon points="-22,2 -34,-22 -12,-4" fill={C.text} stroke={C.accent} strokeWidth={2} />
      <polygon points="22,2 34,-22 12,-4" fill={C.text} stroke={C.accent} strokeWidth={2} />
      <path d="M-20,10 Q0,0 20,10 L20,28 Q20,42 0,48 Q-20,42 -20,28 Z" fill={C.text} stroke={C.accent} strokeWidth={2} />
      <circle cx="-11" cy="22" r="4" fill={C.accent} />
      <circle cx="11" cy="22" r="4" fill={C.accent} />
      <path d="M-10,14 Q-7,10 -4,14" fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M10,14 Q7,10 4,14" fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx="0" cy="28" r="2" fill={C.accent} />
    </g>
  )
}

export function PackArt({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full sm:w-[300px] aspect-[2/3] rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center p-6 shadow-lg transition-all duration-200"
      style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})` }}
    >
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        <svg width="240" height="360" viewBox="0 0 240 360" style={{ filter: 'drop-shadow(0 0 20px rgba(240,184,74,0.45))' }}>
          <defs>
            <path id="matsuriBody" d="M60,70 L120,42 L180,70 Q202,70 202,92 L202,308 Q202,328 180,328 L60,328 Q38,328 38,308 L38,92 Q38,72 60,70 Z" />
            <pattern id="asanoha" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10,2 L13,6 L18,6 L15,10 L17,14 L10,12 L3,14 L5,10 L2,6 L7,6 Z" fill={C.accent2} fillOpacity={0.25} />
            </pattern>
          </defs>
          <use href="#matsuriBody" fill={C.accent} />
          <use href="#matsuriBody" fill="url(#asanoha)" fillOpacity={0.25} />
          <use href="#matsuriBody" fill="none" stroke={C.accent2} strokeWidth={2} />
          <path d="M120,70 L120,38" stroke={C.accent2} strokeWidth={3} strokeLinecap="round" />
          <ellipse cx="120" cy="26" rx="6" ry="3.5" fill="none" stroke={C.accent2} strokeWidth={3} strokeLinecap="round" />
          <rect x="95" y="122" width="50" height="140" rx="10" fill={C.text} />
          <text x="120" y="192" textAnchor="middle" fill={C.accent} fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13" letterSpacing={6}>
            ANIMEPULL
          </text>
          <KitsuneMask x={120} y={276} scale={1} />
        </svg>
      </motion.div>
    </motion.button>
  )
}

export function CardBack() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-5 text-center" style={{
      background: C.bg,
      border: `2px solid ${C.accent2}`,
      boxShadow: `inset 0 0 50px rgba(240,184,74,0.12)`,
    }}>
      <svg width="100%" height="100%" viewBox="0 0 240 320" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="matsuriSeigaiha" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
            <path d="M0,25 A25,25 0 0 1 50,25 A25,25 0 0 1 100,25 M50,25 A25,25 0 0 0 100,25 A25,25 0 0 0 150,25" fill="none" stroke="#7c8cc8" strokeWidth={2} strokeOpacity={0.3} />
          </pattern>
        </defs>
        <rect width="240" height="320" fill="url(#matsuriSeigaiha)" />
        <rect x="6" y="6" width="228" height="308" rx="26" fill="none" stroke={C.accent2} strokeWidth={2.5} />
        <rect x="13" y="13" width="214" height="294" rx="20" fill="none" stroke={C.accent2} strokeWidth={1} opacity={0.6} />
        <g id="matsuriLantern">
          <line x1="40" y1="28" x2="40" y2="46" stroke={C.accent2} strokeWidth={2} />
          <rect x="35" y="46" width="10" height="4" fill={C.accent2} />
          <rect x="32" y="68" width="16" height="4" fill={C.accent2} />
          <circle cx="40" cy="60" r="10" fill={C.accent} />
          <rect x="30" y="58" width="20" height="4" fill={C.accent2} opacity={0.6} />
        </g>
        <use href="#matsuriLantern" />
        <use href="#matsuriLantern" transform="translate(180,0)" />
        <KitsuneMask x={120} y={138} scale={2.1} />
        <text x="120" y="296" textAnchor="middle" fill={C.text} fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13" letterSpacing={3}>
          Clique para revelar
        </text>
      </svg>
    </div>
  )
}

export function Background() {
  const petals = Array.from({ length: 10 }, (_, i) => ({
    x: 10 + (i * 37 % 90),
    y: -20 - i * 11,
    duration: 7 + (i % 4),
    delay: (i % 5) * 1.2,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {petals.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: 7,
            height: 7,
            background: `rgba(246,236,217,0.55)`,
            borderRadius: '50%',
          }}
          animate={{ y: p.y + 1050, rotate: 120, opacity: [0, 0.5, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }}
        />
      ))}
    </div>
  )
}

export const matsuriTheme: Theme = {
  id: 'matsuri',
  name: 'Matsuri',
  palette: C,
  PackArt,
  CardBack,
  Background,
}
