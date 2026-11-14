import { motion } from 'framer-motion'

interface PacksTabProps {
  onOpenPack: () => void
}

export function PacksTab({ onOpenPack }: PacksTabProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-200">
      <motion.button
        onClick={onOpenPack}
        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-3"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Abrir Pack (5 Cards)
      </motion.button>
    </div>
  )
}
