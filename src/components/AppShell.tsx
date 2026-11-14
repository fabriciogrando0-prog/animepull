export type Tab = 'Packs' | 'Coleção' | 'Ranking'

interface AppShellProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  children: React.ReactNode
}

const TABS: Tab[] = ['Packs', 'Coleção', 'Ranking']

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="flex flex-col h-full bg-[#0b0b14] text-gray-200">
      <header className="border-b border-gray-800 bg-[#0b0b14]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto w-full px-4 flex items-center justify-between h-16">
          <div className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
            ANIMEPULL
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>Packs: 5</span>
            <span>Moedas: 0</span>
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
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-500 hover:text-gray-200 border-b-2 border-transparent'
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
