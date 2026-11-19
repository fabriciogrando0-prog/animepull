import { useState, useRef } from 'react'
import type { Character } from './RarityBadge'
import { searchCharacters, type ImageCandidate, type MatchConfidence } from '../lib/anilistSearch'

interface BatchResult {
  characterId: number
  searchedName: string
  searchedFranchise: string | null
  candidate: ImageCandidate | null
  status: 'encontrado' | 'revisar' | 'nao-encontrado' | 'erro'
  error?: string
}

const BATCH_LIMIT = 20
const BATCH_DELAY = 800

function detectFranchiseFromCharacter(character: Character): string | null {
  const anime = character.media.nodes.find(n => n.type === 'ANIME')
  if (!anime) return null
  return anime.title.english || anime.title.romaji || null
}

function nameVariants(fullName: string): string[] {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/).filter(Boolean)
  const variants: string[] = [trimmed]
  if (parts.length > 1) {
    variants.push(parts[parts.length - 1])
    variants.push(`${parts[0]} ${parts[parts.length - 1]}`)
  }
  return [...new Set(variants)]
}

function statusFromMatch(match: MatchConfidence): BatchResult['status'] {
  if (match === 'provavel') return 'encontrado'
  if (match === 'incerta') return 'revisar'
  return 'nao-encontrado'
}

export function ImageBatchSearch({ characters, selectedIds }: { characters: Character[]; selectedIds: Set<number> }) {
  const [isSearching, setIsSearching] = useState(false)
  const cancelledRef = useRef(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<BatchResult[]>([])

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const searchWithFallbacks = async (
    name: string,
    franchise: string | null,
    triedQueries: Set<string>
  ): Promise<ImageCandidate | null> => {
    const variants = nameVariants(name)
    for (const variant of variants) {
      if (cancelledRef.current) return null
      const queryKey = `${variant.toLowerCase()}|${(franchise || '').toLowerCase()}`
      if (triedQueries.has(queryKey)) continue
      triedQueries.add(queryKey)

      try {
        const candidates = await searchCharacters(variant, franchise || undefined)
        if (candidates.length === 0) continue
        const best = candidates[0]
        if (best.match !== 'nao-encontrada') return best
      } catch {
        continue
      }
    }
    return null
  }

  const runBatch = async () => {
    const selectedChars = characters.filter(c => selectedIds.has(c.id)).slice(0, BATCH_LIMIT)
    if (selectedChars.length === 0) return

    cancelledRef.current = false
    setIsSearching(true)
    setProgress({ current: 0, total: selectedChars.length })
    setResults([])

    const triedQueries = new Set<string>()
    const batchResults: BatchResult[] = []

    for (let i = 0; i < selectedChars.length; i++) {
      if (cancelledRef.current) break

      const char = selectedChars[i]
      const franchise = detectFranchiseFromCharacter(char)
      setProgress({ current: i, total: selectedChars.length })

      let candidate: ImageCandidate | null = null
      let status: BatchResult['status'] = 'nao-encontrado'
      let error: string | undefined

      try {
        candidate = await searchWithFallbacks(char.name.full, franchise, triedQueries)
        if (candidate) {
          status = statusFromMatch(candidate.match)
        } else {
          status = 'nao-encontrado'
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Erro ao buscar'
        status = 'erro'
      }

      batchResults.push({
        characterId: char.id,
        searchedName: char.name.full,
        searchedFranchise: franchise,
        candidate,
        status,
        error,
      })

      setResults([...batchResults])
      setProgress({ current: i + 1, total: selectedChars.length })

      if (i < selectedChars.length - 1 && !cancelledRef.current) {
        await sleep(BATCH_DELAY)
      }
    }

    setIsSearching(false)
  }

  const cancelBatch = () => {
    cancelledRef.current = true
    setIsSearching(false)
  }

  const retryResult = async (index: number) => {
    const result = results[index]
    if (!result) return
    const char = characters.find(c => c.id === result.characterId)
    if (!char) return

    const franchise = detectFranchiseFromCharacter(char)
    const triedQueries = new Set<string>()
    const candidate = await searchWithFallbacks(char.name.full, franchise, triedQueries)

    setResults(prev => prev.map((r, i) => {
      if (i !== index) return r
      if (candidate) {
        return { ...r, candidate, status: statusFromMatch(candidate.match), error: undefined }
      }
      return { ...r, status: 'nao-encontrado', error: 'Não encontrado na nova tentativa' }
    }))
  }

  const encontrados = results.filter(r => r.status === 'encontrado').length
  const revisar = results.filter(r => r.status === 'revisar').length
  const naoEncontrados = results.filter(r => r.status === 'nao-encontrado' || r.status === 'erro').length

  if (!isSearching && results.length === 0) {
    const selectedCount = selectedIds.size
    return (
      <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Busca automática em lote</h2>
          <span className="px-2 py-0.5 rounded text-xs font-medium border border-gray-600 text-gray-400">
            Até 20 personagens
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Selecione personagens na galeria acima e clique em "Buscar imagens em lote" para pesquisar
          automaticamente nome e franquia de cada um na AniList. Nenhuma imagem é baixada nem alterada.
        </p>
        <button
          onClick={runBatch}
          disabled={selectedCount === 0 || isSearching}
          className="px-4 py-2 rounded border border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {selectedCount === 0 ? 'Selecione personagens primeiro' : 'Buscar imagens em lote'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          {selectedCount} personagem{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
          {selectedCount > BATCH_LIMIT ? ` (limite de ${BATCH_LIMIT} por lote)` : ''}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Busca automática em lote</h2>
        <span className="px-2 py-0.5 rounded text-xs font-medium border border-gray-600 text-gray-400">
          {progress.current}/{progress.total} pesquisados
        </span>
      </div>

      {isSearching && (
        <div className="mb-4">
          <button
            onClick={cancelBatch}
            className="px-4 py-2 rounded border border-[#ef4444] text-[#fca5a5] hover:bg-[#ef4444]/10 transition-colors"
          >
            Interromper lote
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/10">
          <div className="text-xs text-[#4ade80] uppercase tracking-wider mb-1">Encontrados</div>
          <div className="text-2xl font-bold">{encontrados}</div>
        </div>
        <div className="p-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10">
          <div className="text-xs text-[#fbbf24] uppercase tracking-wider mb-1">Revisar</div>
          <div className="text-2xl font-bold">{revisar}</div>
        </div>
        <div className="p-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10">
          <div className="text-xs text-[#f87171] uppercase tracking-wider mb-1">Não encontrados</div>
          <div className="text-2xl font-bold">{naoEncontrados}</div>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => {
          const candidate = result.candidate
          const hasImage = Boolean(candidate?.imageMedium)
          return (
            <div key={result.characterId} className="rounded-lg border border-gray-700 bg-gray-900 p-3 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="aspect-[2/3] w-20 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                  {hasImage && candidate ? (
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
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-semibold line-clamp-1 text-[#e5e7eb]">{result.searchedName}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        result.status === 'encontrado'
                          ? 'border-[#16a34a] text-[#4ade80]'
                          : result.status === 'revisar'
                          ? 'border-[#f59e0b] text-[#fbbf24]'
                          : 'border-[#ef4444] text-[#f87171]'
                      }`}
                    >
                      {result.status === 'encontrado' ? 'Encontrado' : result.status === 'revisar' ? 'Revisar' : 'Não encontrado'}
                    </span>
                  </div>
                  {candidate && (
                    <p className="text-xs text-gray-400 truncate mb-1">
                      Encontrado: {candidate.name} &bull; Franquia: {candidate.franchiseDetected || '—'} &bull; {candidate.resolution}
                    </p>
                  )}
                  {!candidate && result.error && (
                    <p className="text-xs text-[#f87171] mb-1">{result.error}</p>
                  )}
                  <div className="flex gap-2">
                    {result.status !== 'encontrado' && (
                      <button
                        onClick={() => retryResult(index)}
                        disabled={isSearching}
                        className="px-3 py-1 rounded border border-gray-600 text-gray-400 hover:text-[#e5e7eb] hover:border-[#e5e7eb] transition-colors text-sm disabled:opacity-50"
                      >
                        Pesquisar novamente
                      </button>
                    )}
                    {candidate && candidate.matchReason && (
                      <span className="text-xs text-gray-500">{candidate.matchReason}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
