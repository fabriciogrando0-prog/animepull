import { useState } from 'react'
import { searchCharacters, type ImageCandidate, type ConfidenceLevel } from '../lib/anilistSearch'

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const styles: Record<ConfidenceLevel, string> = {
    alta: 'bg-[#16a34a]/20 border-[#16a34a] text-[#4ade80]',
    media: 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24]',
    baixa: 'bg-[#ef4444]/20 border-[#ef4444] text-[#f87171]',
  }
  const labels: Record<ConfidenceLevel, string> = {
    alta: 'Alta confiança',
    media: 'Média confiança',
    baixa: 'Baixa confiança',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[confidence]}`}>
      {labels[confidence]}
    </span>
  )
}

export { ConfidenceBadge }

export function ImageSearch() {
  const [name, setName] = useState('')
  const [franchise, setFranchise] = useState('')
  const [candidates, setCandidates] = useState<ImageCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setCandidates([])
    setLoading(true)
    try {
      const results = await searchCharacters(name, franchise || undefined)
      setCandidates(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar no AniList.')
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setName('')
    setFranchise('')
    setCandidates([])
    setError(null)
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Buscar personagem (AniList)</h2>
        <span className="px-2 py-0.5 rounded text-xs font-medium border border-gray-600 text-gray-400">
          Somente busca
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        Pesquise um personagem pelo nome e pela franquia. O resultado exibe a imagem da AniList, a franquia detectada e a
        resolução. Um aviso aparece quando a correspondência pode estar incorreta. Nenhuma imagem é baixada nem alterada.
      </p>
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 items-end">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Nome do personagem</label>
          <input
            className="w-full px-3 py-2 rounded border border-gray-600 bg-[#0b0b14] text-[#e5e7eb] focus:border-[#e5e7eb] outline-none"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Ex: Monkey D. Luffy"
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Franquia / anime</label>
          <input
            className="w-full px-3 py-2 rounded border border-gray-600 bg-[#0b0b14] text-[#e5e7eb] focus:border-[#e5e7eb] outline-none"
            value={franchise}
            onChange={event => setFranchise(event.target.value)}
            placeholder="Ex: One Piece"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded border border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded border border-[#ef4444]/50 bg-[#ef4444]/10 text-[#fca5a5] text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-400">
          {candidates.length} resultado{candidates.length !== 1 ? 's' : ''}
        </span>
        {candidates.length > 0 && (
          <button
            onClick={resetSearch}
            className="px-3 py-1 rounded border border-gray-600 text-gray-400 hover:text-[#e5e7eb] hover:border-[#e5e7eb] transition-colors text-sm"
          >
            Pesquisar novamente
          </button>
        )}
      </div>

      {candidates.length > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          Resultados ordenados por pontuação (0 a 100). A pontuação é uma indicação interna de confiança, não uma garantia de acerto.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...candidates].sort((a, b) => b.score - a.score || b.favourites - a.favourites || a.id - b.id).map((candidate, index) => {
          const isTop = index === 0
          return (
            <div
              key={candidate.id}
              className={`rounded-lg border bg-gray-900 p-3 flex flex-col h-full ${
                isTop ? 'border-[#fbbf24] ring-1 ring-[#fbbf24]/60' : 'border-gray-700'
              }`}
            >
              <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-800 mb-2">
                {candidate.imageMedium ? (
                  <img
                    src={candidate.imageMedium}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                    Sem imagem
                  </div>
                )}
              </div>
              <h4 className="text-sm font-semibold line-clamp-1 mb-1">{candidate.name}</h4>
              {candidate.nativeName && (
                <p className="text-xs text-gray-500 truncate mb-1">{candidate.nativeName}</p>
              )}
              <p className="text-xs text-gray-400 truncate mb-1">
                Franquia detectada: {candidate.franchiseDetected || '—'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <ConfidenceBadge confidence={candidate.confidence} />
                <span className="text-xs font-bold text-[#e5e7eb]">
                  Pontuação: {candidate.score}/100
                </span>
                {isTop && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold border border-[#fbbf24] text-[#fbbf24]">
                    Mais confiável
                  </span>
                )}
              </div>
              {candidate.franchiseMismatch && (
                <p className="text-xs text-[#fca5a5] font-medium mb-1">
                  ⚠ Possível erro de franquia: detectado "{candidate.franchiseDetected}" não confere com a busca.
                </p>
              )}
              <p className="text-xs text-gray-400 mb-2 line-clamp-2">{candidate.confidenceReason}</p>
              <p className="text-xs text-gray-500 mb-2">{candidate.resolution}</p>
            </div>
          )
        })}
        {candidates.length === 0 && !loading && !error && (
          <p className="col-span-full text-center text-gray-500 text-sm">
            Busque um personagem para ver os resultados.
          </p>
        )}
      </div>
    </section>
  )
}
