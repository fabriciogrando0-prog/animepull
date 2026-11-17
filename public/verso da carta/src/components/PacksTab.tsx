import { PackArt } from './PackArt'
import { themes } from '../themes/index'
import { useTheme } from '../themes/ThemeContext'

interface PacksTabProps {
  onOpenPack: () => void
}

export function PacksTab({ onOpenPack }: PacksTabProps) {
  const { theme, nextTheme } = useTheme()

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-[#e5e7eb]">
      <PackArt onClick={onOpenPack} />
      <div className="text-sm font-medium text-[#e5e7eb]">Set: {theme.name}</div>
      <button
        onClick={onOpenPack}
        className="px-6 py-2 text-sm font-medium text-[var(--bg)] bg-[var(--accent)] rounded-xl hover:bg-[var(--accent2)]/90 transition-all"
      >
        Abrir Pack
      </button>
      <button
        onClick={nextTheme}
        className="px-4 py-1.5 text-xs font-medium text-[var(--accent)] bg-[var(--surface)] border border-[var(--accent2)]/30 rounded-xl hover:bg-[var(--accent2)]/10 transition-all"
      >
        Sortear outro pack
      </button>
      <div className="text-xs text-[#e5e7eb]/70">Packs disponíveis: {themes.length}</div>
    </div>
  )
}
