import { motion } from 'framer-motion'
import { useTheme } from '../themes/ThemeContext'

interface PackArtProps {
  onClick: () => void
}

export function PackArt({ onClick }: PackArtProps) {
  const { theme } = useTheme()

  const CustomPackArt = theme.PackArt as React.ComponentType<any> | undefined
  if (CustomPackArt) {
    return <CustomPackArt onClick={onClick} />
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full sm:w-[300px] aspect-[2/3] rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center p-6 text-white shadow-lg transition-all duration-200"
      style={{
        background: `linear-gradient(135deg, var(--accent), var(--accent2))`,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <p className="text-sm font-semibold uppercase tracking-widest">
          Set: {theme.name}
        </p>
        <p className="text-2xl sm:text-3xl font-black tracking-tighter">
          ANIMEPULL
        </p>
      </div>
    </motion.button>
  )
}
