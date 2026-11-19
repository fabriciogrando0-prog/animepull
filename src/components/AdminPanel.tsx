import { useState } from 'react'
import type { Character } from './RarityBadge'
import { ImageCollectorStats } from './ImageCollectorStats'
import { CharacterGalleryAdmin } from './CharacterGalleryAdmin'
import { BatchConfirmation } from './BatchConfirmation'
import { ImageSearch } from './ImageSearch'

interface AdminPanelProps {
  onClose: () => void
  characters: Character[]
}

export function AdminPanel({ onClose, characters }: AdminPanelProps) {
  const total = characters.length
  const withImage = characters.filter(c => Boolean(c.image.large)).length
  const withoutImage = total - withImage
  const anilistOriginal = withImage

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batch, setBatch] = useState<{ ids: number[]; names: string[] } | null>(null)

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectPage = (ids: number[], remove = false) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (remove) {
        ids.forEach(id => next.delete(id))
      } else {
        ids.forEach(id => next.add(id))
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectWithoutImage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      characters.filter(c => !Boolean(c.image.large)).forEach(c => next.add(c.id))
      return next
    })
  }

  const prepareBatch = () => {
    if (selectedIds.size === 0) return
    const selectedChars = characters.filter(c => selectedIds.has(c.id))
    const batchChars = selectedChars.slice(0, 20)
    setBatch({ ids: batchChars.map(c => c.id), names: batchChars.map(c => c.name.full) })
  }

  const confirmBatch = () => setBatch(null)

  return (
    <div className="flex flex-col h-full bg-[#0b0b14] text-[#e5e7eb]">
      <header className="border-b border-gray-800 bg-[#0b0b14]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto w-full px-4 flex items-center justify-between h-16">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-[#e5e7eb] transition-colors"
          >
            ← Voltar ao jogo
          </button>
          <div className="font-black text-xl tracking-tighter">AnimePull — Administração</div>
          <div className="w-20" />
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto w-full px-4 py-8">
          <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">Image Collector</h2>
              <span className="px-2 py-0.5 rounded text-xs font-medium border border-gray-600 text-gray-400">
                Em desenvolvimento
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              A busca de personagens usa a AniList (via proxy '/api/anilist') e não baixa nem altera imagens. Os cards
              abaixo exibem o catálogo já carregado pelo jogo.
            </p>
            <ImageCollectorStats
              total={total}
              withImage={withImage}
              withoutImage={withoutImage}
              anilistOriginal={anilistOriginal}
            />
          </section>
          <ImageSearch />
          <CharacterGalleryAdmin
            characters={characters}
            selectedIds={selectedIds}
            onToggle={toggleSelection}
            onSelectPage={selectPage}
            onClearSelection={clearSelection}
            onSelectWithoutImage={selectWithoutImage}
            onPrepareBatch={prepareBatch}
          />
        </div>
      </main>
      {batch && (
        <BatchConfirmation
          open
          characters={characters.filter(c => batch.ids.includes(c.id))}
          totalSelected={selectedIds.size}
          onConfirm={confirmBatch}
          onCancel={confirmBatch}
        />
      )}
    </div>
  )
}
