import { motion } from 'framer-motion'

interface ParticleProps {
  x: number
  y: number
  color: string
  size: number
  delay?: number
}

export function Particle({ x, y, color, size, delay = 0 }: ParticleProps) {
  const angle = Math.random() * Math.PI * 2
  const distance = 100 + Math.random() * 200
  const endX = Math.cos(angle) * distance
  const endY = Math.sin(angle) * distance
  const rotation = (Math.random() - 0.5) * 720

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
      animate={{ x: endX, y: endY, scale: [1, 0], rotate: rotation, opacity: 0 }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  )
}
