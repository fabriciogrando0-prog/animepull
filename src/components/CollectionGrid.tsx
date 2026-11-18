import { useMemo } from 'react'
import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'

const RARITY_ORDER: { [key: string]: number } = {
  Mítico: 0,
  Lendário: 1,
  Épico: 2,
  Raro: 3,
  Incomum: 4,
  Comum: 5,
}

export function CollectionGrid({ collection }: { collection: Character[] }) {
  const sorted = useMemo(
    () =>
      [...collection].sort((a, b) => {
        const ra = RARITY_ORDER[a.rarity ?? 'Comum'] ?? 99
        const rb = RARITY_ORDER[b.rarity ?? 'Comum'] ?? 99
        if (ra !== rb) return ra - rb
        return (b.favourites ?? 0) - (a.favourites ?? 0)
      }),
    [collection],
  )

  const total = collection.length
  const counts: { [key: string]: number } = {}
  for (const c of collection) {
    const r = c.rarity ?? 'Comum'
    counts[r] = (counts[r] ?? 0) + 1
  }
  const rarities = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => RARITY_ORDER[a[0]] - RARITY_ORDER[b[0]])

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg">Você ainda não tem cartas. Abra um pack!</p>
      </div>
    )
  }

  return (
    <section className="w-full max-w-7xl px-4 py-6">
      <div className="flex items-center gap-4 mb-6 text-sm">
        <span className="font-semibold">Coleção: {total} cartas</span>
        <div className="flex gap-2 flex-wrap">
          {rarities.map(([rarity, n]) => {
            const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]
            return (
              <span
                key={rarity}
                className="px-2 py-1 rounded border text-[10px] font-semibold border-solid"
                style={{ borderColor: color.border.startsWith('#') ? color.border : 'currentColor' }}>
                {rarity} {n}
              </span>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {sorted.map((character) => {
          const colors = RARITY_COLORS[character.rarity ?? 'Comum']
          return (
            <div
              key={character.id}
              className="aspect-[2/3] rounded-xl overflow-hidden relative border-2 border-solid"
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
