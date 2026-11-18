import type { Character } from './RarityBadge'
import { CollectionBackup } from './CollectionBackup'
import { CollectionGrid } from './CollectionGrid'

export function ColecaoTab({ collection }: { collection: Character[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <CollectionGrid collection={collection} />
      <CollectionBackup />
    </div>
  )
}
