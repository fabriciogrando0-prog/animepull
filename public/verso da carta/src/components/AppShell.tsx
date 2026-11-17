import type { Character } from './RarityBadge'
import { useEffects } from './EffectsContext'

export type Tab = 'Packs' | 'Coleção' | 'Ranking'

interface AppShellProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  children: React.ReactNode
  collection: Character[]
}

const TABS: Tab[] = ['Packs', 'Coleção', 'Ranking']

export function AppShell({ activeTab, onTabChange, children, collection }: AppShellProps) {
  const { enabled, toggleEffects } = useEffects()
  const distinct = new Set(collection.map(c => c.id)).size
  return (
    <div className="flex flex-col h-full bg-[#0b0b14] text-[#e5e7eb]">
        <header className="border-b border-gray-800 bg-[#0b0b14]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto w-full px-4 flex items-center justify-between h-16">
          <div className="font-black text-xl tracking-tighter text-[#e5e7eb] flex items-center gap-2">
            ANIMEPULL
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>Packs: 5</span>
            <span>Moedas: 0</span>
            <span>Coleção: {distinct.toLocaleString('pt-BR')}</span>
            <button
              onClick={toggleEffects}
              className={`ml-2 px-2 py-1 rounded border text-sm ${enabled
                ? 'border-[#e5e7eb] text-[#e5e7eb]'
                : 'border-gray-600 text-gray-400'}`}
              title="Ligar/desligar efeitos visuais"
            >
              Efeitos: {enabled ? 'ligado' : 'desligado'}
            </button>
          </div>
        </div>
        <nav className="border-b border-gray-800">
          <div className="max-w-6xl mx-auto w-full px-4 flex gap-8">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-[#e5e7eb] border-b-2 border-[var(--accent)]'
                    : 'text-gray-500 hover:text-[#e5e7eb] border-b-2 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto w-full px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
