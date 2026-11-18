import type { Character } from './RarityBadge'
import { ImageCollectorStats } from './ImageCollectorStats'
import { CharacterGalleryAdmin } from './CharacterGalleryAdmin'

interface AdminPanelProps {
  onClose: () => void
  characters: Character[]
}

export function AdminPanel({ onClose, characters }: AdminPanelProps) {
  const total = characters.length
  const withImage = characters.filter(c => Boolean(c.image.large)).length
  const withoutImage = total - withImage
  const anilistOriginal = withImage

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
              Nenhuma busca, download ou alteração de imagem está disponível nesta etapa. Os dados abaixo vêm do
              catálogo j\u00e1 carregado pelo jogo.
            </p>
            <ImageCollectorStats
              total={total}
              withImage={withImage}
              withoutImage={withoutImage}
              anilistOriginal={anilistOriginal}
            />
          </section>
          <CharacterGalleryAdmin characters={characters} />
        </div>
      </main>
    </div>
  )
}
