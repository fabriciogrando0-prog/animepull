import { useState } from 'react'
import type { Character } from './RarityBadge'
import { CharacterThumbnailAdmin } from './CharacterThumbnailAdmin'

const PER_PAGE = 24

type ImageFilter = 'todos' | 'com-imagem' | 'sem-imagem'

interface CharacterGalleryAdminProps {
  characters: Character[]
}

export function CharacterGalleryAdmin({ characters }: CharacterGalleryAdminProps) {
  const [filter, setFilter] = useState<ImageFilter>('todos')
  const [page, setPage] = useState(1)

  let filtered = characters
  if (filter === 'com-imagem') {
    filtered = characters.filter(c => Boolean(c.image.large))
  } else if (filter === 'sem-imagem') {
    filtered = characters.filter(c => !Boolean(c.image.large))
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const items = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded text-sm border ${
      active
        ? 'border-[#e5e7eb] text-[#e5e7eb] bg-[#e5e7eb]/10'
        : 'border-gray-600 text-gray-400 hover:border-[#e5e7eb] hover:text-[#e5e7eb]'
    }`

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6 mt-6">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('todos')} className={chipClass(filter === 'todos')}>
            Todos
          </button>
          <button onClick={() => setFilter('com-imagem')} className={chipClass(filter === 'com-imagem')}>
            Com imagem
          </button>
          <button onClick={() => setFilter('sem-imagem')} className={chipClass(filter === 'sem-imagem')}>
            Sem imagem
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {items.map(char => (
            <CharacterThumbnailAdmin key={char.id} character={char} />
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>P\u00e1gina {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-gray-600 text-gray-400 disabled:opacity-50 disabled:pointer-events-none"
            >
              Anterior
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border border-gray-600 text-gray-400 disabled:opacity-50 disabled:pointer-events-none"
            >
              Pr\u00f3xima
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
