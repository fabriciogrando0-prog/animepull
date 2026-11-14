import { PackArt } from './PackArt'
import { useTheme } from '../themes/ThemeContext'

interface PacksTabProps {
  onOpenPack: () => void
}

export function PacksTab({ onOpenPack }: PacksTabProps) {
  const { nextTheme } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center h-full text-[#e5e7eb]">
      <PackArt onClick={onOpenPack} />
      <button
        onClick={nextTheme}
        className="mt-4 px-6 py-2 text-sm font-medium text-[var(--accent)] bg-[var(--surface)] border border-[var(--accent2)]/30 rounded-xl hover:bg-[var(--accent2)]/10 transition-all"
      >
        Sortear outro pack
      </button>
    </div>
  )
}
