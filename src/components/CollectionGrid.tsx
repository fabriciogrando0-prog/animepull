import { useDeferredValue, useMemo, useState } from 'react'
import type { Character, Rarity } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'
import { CardDetailModal } from './CardDetailModal'

const RARITY_ORDER: { [key: string]: number } = {
  Mítico: 0,
  Lendário: 1,
  Épico: 2,
  Raro: 3,
  Incomum: 4,
  Comum: 5,
}

const RARITIES: Rarity[] = ['Mítico', 'Lendário', 'Épico', 'Raro', 'Incomum', 'Comum']

type SortBy = 'raridade' | 'favoritos' | 'nome' | 'recentes'

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function CollectionGrid({ collection }: { collection: Character[] }) {
  const [searchText, setSearchText] = useState('')
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set())
  const [sortBy, setSortBy] = useState<SortBy>('raridade')
  const [selectedCard, setSelectedCard] = useState<Character | null>(null)

  const query = useDeferredValue(searchText)
  const q = normalize(query).trim()

  const matchesQuery = (c: Character) => {
    const anime = c.media.nodes.find((n) => n.type === 'ANIME')
    const fields = [
      normalize(c.name.full),
      normalize(c.name.native ?? ''),
      normalize(anime?.title.romaji ?? ''),
      normalize(anime?.title.english ?? ''),
    ]
    return fields.some((field) => field.includes(q))
  }

  const searchFiltered = useMemo(
    () => collection.filter((c) => (q ? matchesQuery(c) : true)),
    [collection, q],
  )

  const counts: { [key: string]: number } = {}
  for (const c of searchFiltered) {
    const r = c.rarity ?? 'Comum'
    counts[r] = (counts[r] ?? 0) + 1
  }

  const filtered = useMemo(
    () =>
      selectedRarities.size === 0
        ? searchFiltered
        : searchFiltered.filter((c) => selectedRarities.has(c.rarity ?? 'Comum')),
    [searchFiltered, selectedRarities],
  )

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === 'favoritos') {
      return arr.sort((a, b) => (b.favourites ?? 0) - (a.favourites ?? 0))
    }
    if (sortBy === 'nome') {
      return arr.sort((a, b) => normalize(a.name.full).localeCompare(normalize(b.name.full)))
    }
    if (sortBy === 'recentes') {
      return arr.reverse()
    }
    return arr.sort((a, b) => {
      const ra = RARITY_ORDER[a.rarity ?? 'Comum'] ?? 99
      const rb = RARITY_ORDER[b.rarity ?? 'Comum'] ?? 99
      if (ra !== rb) return ra - rb
      return (b.favourites ?? 0) - (a.favourites ?? 0)
    })
  }, [filtered, sortBy])

  const total = collection.length
  const showing = sorted.length

  const clearFilters = () => {
    setSearchText('')
    setSelectedRarities(new Set())
    setSortBy('raridade')
  }

  if (showing === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg">Nenhuma carta encontrada.</p>
        <button
          onClick={clearFilters}
          className="mt-4 px-4 py-2 rounded border border-gray-600 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
          Limpar filtros
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="w-full max-w-7xl px-4 py-6">
      <input
        type="text"
        placeholder="Buscar carta ou anime..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full max-w-[360px] px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
      />
      <div className="flex gap-2 flex-wrap mt-3">
        {RARITIES.map((rarity) => {
          const color = RARITY_COLORS[rarity]
          const active = selectedRarities.has(rarity)
          return (
            <button
              key={rarity}
              onClick={() => {
                setSelectedRarities((prev) => {
                  const next = new Set(prev)
                  if (next.has(rarity)) next.delete(rarity)
                  else next.add(rarity)
                  return next
                })
              }}
              className={`px-3 py-1 rounded text-[11px] font-semibold border-2 border-solid transition cursor-pointer ${active ? '' : 'text-gray-400 dark:text-gray-500'}`}
              style={{
                borderColor: color.border.startsWith('#') ? color.border : 'currentColor',
                ...(active ? { backgroundColor: color.primary, color: '#0b0b14' } : {}),
              }}>
              {rarity} {counts[rarity] ?? 0}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 text-sm">
        <span className="font-semibold">{showing} de {total} cartas</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-2 py-1 rounded border text-sm bg-transparent cursor-pointer">
          <option value="raridade">Raridade</option>
          <option value="favoritos">Favoritos</option>
          <option value="nome">Nome A-Z</option>
          <option value="recentes">Mais recentes</option>
        </select>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-4">
        {sorted.map((character) => {
          const colors = RARITY_COLORS[character.rarity ?? 'Comum']
          return (
            <button
              type="button"
              key={character.id}
              onClick={() => setSelectedCard(character)}
              className="aspect-[2/3] rounded-xl overflow-hidden relative border-2 border-solid m-0 p-0 bg-transparent text-left cursor-pointer"
              style={{ borderColor: colors.primary }}>
              <img
                src={character.image.large}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                alt={character.name.full}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                <p
                  className="line-clamp-1 text-[11px] text-white font-medium truncate"
                  title={character.name.full}>
                  {character.name.full}
                </p>
                <p className="text-[10px] text-white/80 truncate" title={character.rarity ?? 'Comum'}>
                  {character.rarity ?? 'Comum'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
      </section>
      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </>
  )
}
