import type { Character } from './RarityBadge'

interface BatchConfirmationProps {
  open: boolean
  characters: Character[]
  totalSelected: number
  onConfirm: () => void
  onCancel: () => void
}

const LIMIT = 20

export function BatchConfirmation({
  open,
  characters,
  totalSelected,
  onConfirm,
  onCancel,
}: BatchConfirmationProps) {
  if (!open) return null

  const batch = characters.slice(0, LIMIT)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#0b0b14] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold mb-2">Preparar lote</h3>
        <p className="text-sm text-gray-400 mb-4">
          {batch.length} personagem{batch.length !== 1 ? 's' : ''} no lote
          {totalSelected > 0 && totalSelected !== batch.length
            ? ` (de ${totalSelected} selecionado${totalSelected !== 1 ? 's' : ''})`
            : ''}
        </p>
        <ul className="max-h-64 overflow-y-auto space-y-2 text-sm mb-4">
          {batch.map(char => (
            <li key={char.id} className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-[#e5e7eb]">{char.name.full}</span>
              <span className="text-xs text-gray-500">
                {!Boolean(char.image.large) ? 'sem imagem' : 'com imagem'}
              </span>
            </li>
          ))}
        </ul>
        {totalSelected > LIMIT && (
          <p className="text-xs text-[#fbbf24] mb-4">
            Limite de {LIMIT} personagens por lote. Os demais permanecem selecionados.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-600 text-gray-400 hover:text-[#e5e7eb] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded border border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10 transition-colors"
          >
            Confirmar lote
          </button>
        </div>
      </div>
    </div>
  )
}
