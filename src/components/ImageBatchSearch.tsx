import { useState, useRef } from 'react'
import type { Character } from './RarityBadge'
import {
  searchCharacters,
  type ImageCandidate,
  type MatchConfidence,
} from '../lib/anilistSearch'
import { ConfidenceBadge } from './ImageSearch'
import type { DownloadItem, DownloadStatus } from '../lib/imageDownloadTypes'
import { searchDanbooruImages, type DanbooruImage } from '../lib/animeImageSource'
import { ImageBatchDownload } from './ImageBatchDownload'

interface BatchResult {
  characterId: number
  searchedName: string
  searchedFranchise: string | null
  candidates: ImageCandidate[]
  danbooruImages: DanbooruImage[]
  danbooruError?: string
  danbooruSearched: boolean
  status: 'encontrado' | 'revisar' | 'nao-encontrado' | 'erro'
  error?: string
  downloaded?: DownloadStatus
}

const BATCH_LIMIT = 20
const BATCH_DELAY = 800
const API = '/__local/images'

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
  const [downloadingIndividual, setDownloadingIndividual] = useState<Set<number>>(new Set())

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const searchWithFallbacks = async (
    name: string,
    franchise: string | null,
    triedQueries: Set<string>
  ): Promise<ImageCandidate[]> => {
    const variants = nameVariants(name)
    for (const variant of variants) {
      if (cancelledRef.current) return []
      const queryKey = `${variant.toLowerCase()}|${(franchise || '').toLowerCase()}`
      if (triedQueries.has(queryKey)) continue
      triedQueries.add(queryKey)

      try {
        const candidates = await searchCharacters(variant, franchise || undefined)
        if (candidates.length === 0) continue
        const valid = candidates.filter(c => c.score > 0)
        if (valid.length > 0) return valid.slice(0, 6)
      } catch {
        continue
      }
    }
    return []
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

      let candidates: ImageCandidate[] = []
      let danbooruImages: DanbooruImage[] = []
      let danbooruError: string | undefined
      let danbooruSearched = false
      let status: BatchResult['status'] = 'nao-encontrado'
      let error: string | undefined

      try {
        candidates = await searchWithFallbacks(char.name.full, franchise, triedQueries)
        if (candidates.length > 0) {
          status = statusFromMatch(candidates[0].match)
        } else {
          status = 'nao-encontrado'
        }

        if (franchise) {
          danbooruSearched = true
          const danbooruResult = await searchDanbooruImages(
            char.name.full,
            franchise,
            char.id
          )
          danbooruImages = danbooruResult.images
          danbooruError = danbooruResult.error
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Erro ao buscar'
        status = 'erro'
      }

      batchResults.push({
        characterId: char.id,
        searchedName: char.name.full,
        searchedFranchise: franchise,
        candidates,
        danbooruImages,
        danbooruError,
        danbooruSearched,
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
    const candidates = await searchWithFallbacks(char.name.full, franchise, triedQueries)

    let danbooruImages: DanbooruImage[] = []
    let danbooruError: string | undefined
    let danbooruSearched = false
    if (franchise) {
      danbooruSearched = true
      const danbooruResult = await searchDanbooruImages(
        char.name.full,
        franchise,
        char.id
      )
      danbooruImages = danbooruResult.images
      danbooruError = danbooruResult.error
    }

    setResults(prev => prev.map((r, i) => {
      if (i !== index) return r
      if (candidates.length > 0) {
        return { ...r, candidates, danbooruImages, danbooruError, danbooruSearched, status: statusFromMatch(candidates[0].match), error: undefined }
      }
      return { ...r, candidates: [], danbooruImages: [], danbooruError, danbooruSearched, status: 'nao-encontrado', error: 'Não encontrado na nova tentativa' }
    }))
  }

  const downloadOne = async (item: DownloadItem) => {
    if (item.confidence !== 'alta') {
      const aprovado = window.confirm(
        `A confiança deste candidato é "${item.confidence}". Deseja baixar mesmo assim?`,
      )
      if (!aprovado) return
    }
    setDownloadingIndividual((prev) => new Set([...prev, item.characterId]))
    try {
      const res = await fetch(`${API}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      const result = await res.json()
      setResults((prev) =>
        prev.map((r) =>
          r.characterId === item.characterId ? { ...r, downloaded: result.status } : r,
        ),
      )
      return result
    } finally {
      setDownloadingIndividual((prev) => {
        const next = new Set(prev)
        next.delete(item.characterId)
        return next
      })
    }
  }

  const downloadItems: DownloadItem[] = [
    ...results
      .filter(r => r.candidates.length > 0 && r.candidates[0].confidence === 'alta')
      .map((r) => {
        const c = r.candidates[0]
        return {
          characterId: c.id,
          name: r.searchedName,
          franchise: r.searchedFranchise,
          imageUrl: c.imageLarge,
          confidence: 'alta' as const,
          score: c.score,
        }
      }),
    ...results
      .filter(r => r.danbooruImages.length > 0)
      .flatMap((r) =>
        r.danbooruImages.map((img) => ({
          characterId: img.characterId,
          name: r.searchedName,
          franchise: img.franchise,
          imageUrl: img.url,
          confidence: 'alta' as const,
          score: img.score,
        }))
      ),
  ]

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
          const candidates = result.candidates
          const hasAnyImage = candidates.some(c => Boolean(c.imageMedium))
          return (
            <div
              key={result.characterId}
              className={`rounded-lg border bg-gray-900 p-3 flex flex-col gap-2 ${
                candidates.some(c => c.confidence === 'alta') ? 'border-[#fbbf24]/60' : 'border-gray-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
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
                  {!hasAnyImage && result.error && (
                    <p className="text-xs text-[#f87171] mb-1">{result.error}</p>
                  )}
                  {!hasAnyImage && candidates.length === 0 && (
                    <p className="text-xs text-gray-500 mb-1">Nenhum candidato encontrado.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {candidates.map((cand, ci) => {
                  const hasImage = Boolean(cand.imageMedium)
                  return (
                    <div
                      key={ci}
                      className={`rounded-lg border p-2 flex flex-col gap-2 bg-gray-800 ${
                        cand.confidence === 'alta' ? 'border-[#fbbf24]/40' : 'border-gray-700'
                      }`}
                    >
                      <div className="aspect-[2/3] w-full rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                        {hasImage ? (
                          <img
                            src={cand.imageMedium}
                            alt={cand.name}
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
                        <p className="text-xs text-gray-400 truncate mb-1">
                          {cand.name} &bull; {cand.franchiseDetected || '—'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#e5e7eb]">Pontuação: {cand.score}/100</span>
                          <ConfidenceBadge confidence={cand.confidence} />
                        </div>
                        {cand.franchiseMismatch && (
                          <p className="text-xs text-[#fca5a5] font-medium mb-1">
                            ⚠ Possível erro de franquia: detectado "{cand.franchiseDetected}" não confere com a busca.
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mb-1 line-clamp-1">{cand.confidenceReason}</p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() =>
                              downloadOne({
                                characterId: result.characterId,
                                name: result.searchedName,
                                franchise: result.searchedFranchise,
                                imageUrl: cand.imageLarge,
                                confidence: cand.confidence,
                                score: cand.score,
                              })
                            }
                            disabled={downloadingIndividual.has(cand.id)}
                            className="px-2 py-1 rounded border text-xs transition-colors ${
                              cand.confidence === 'alta'
                                ? 'border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10 disabled:opacity-50 disabled:pointer-events-none'
                                : 'border-gray-600 text-gray-600'
                            }"
                            title={
                              cand.confidence === 'alta'
                                ? 'Baixar imagem (alta confiança)'
                                : 'Baixe apenas com aprovação manual (confiança não alta)'
                            }
                          >
                            {downloadingIndividual.has(cand.id)
                              ? 'Baixando...'
                              : cand.confidence === 'alta'
                                ? 'Baixar'
                                : 'Aprovar'}
                          </button>
                          {cand.matchReason && (
                            <span className="text-xs text-gray-500">{cand.matchReason}</span>
                          )}
                        </div>
                        {result.downloaded && (
                          <span
                            className={`text-[10px] font-bold ml-2 px-1.5 py-0.5 rounded border ${
                              result.downloaded === 'baixado'
                                ? 'text-[#4ade80] border-[#16a34a]/50'
                                : result.downloaded === 'ignorado'
                                  ? 'text-[#fbbf24] border-[#f59e0b]/50'
                                  : 'text-[#f87171] border-[#ef4444]/50'
                            }`}
                          >
                            {result.downloaded === 'baixado'
                              ? 'Salvo'
                              : result.downloaded === 'ignorado'
                                ? 'Já existe'
                                : 'Falha'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              {!hasAnyImage && candidates.length === 0 && (
                <div className="col-span-3 rounded-lg border p-2 flex flex-col items-center justify-center bg-gray-800">
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                    Sem imagem
                  </div>
                </div>
              )}
              </div>

              {result.danbooruSearched && (
                <div className="mt-3 border-t border-gray-700 pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#e5e7eb]">Imagens alternativas (Danbooru)</span>
                    {result.danbooruError && (
                      <span className="text-xs text-[#f87171]">Erro: {result.danbooruError}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {result.danbooruImages.map((img) => (
                      <div
                        key={img.id}
                        className="rounded-lg border p-2 flex flex-col gap-1 bg-gray-800 border-gray-600"
                      >
                        <div className="aspect-[2/3] w-full rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                          <img
                            src={img.previewUrl}
                            alt={img.tags.slice(0, 3).join(', ')}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 truncate mb-1">
                            {img.width} × {img.height} &bull; score {img.score}
                          </p>
                          <button
                            onClick={() =>
                              downloadOne({
                                characterId: result.characterId,
                                name: result.searchedName,
                                franchise: img.franchise,
                                imageUrl: img.url,
                                confidence: 'alta',
                                score: img.score,
                              })
                            }
                            disabled={downloadingIndividual.has(img.characterId)}
                            className="w-full px-2 py-1 rounded border text-xs transition-colors ${
                              downloadingIndividual.has(img.characterId)
                                ? 'border-[#e5e7eb] text-[#e5e7eb] bg-[#e5e7eb]/10 disabled:opacity-50 disabled:pointer-events-none'
                                : 'border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10'
                            }"
                          >
                            {downloadingIndividual.has(img.characterId)
                              ? 'Baixando...'
                              : 'Baixar (Danbooru)'}
                          </button>
                          {result.downloaded && (
                            <span
                              className={`text-[10px] font-bold ml-2 px-1.5 py-0.5 rounded border ${
                                result.downloaded === 'baixado'
                                  ? 'text-[#4ade80] border-[#16a34a]/50'
                                  : result.downloaded === 'ignorado'
                                    ? 'text-[#fbbf24] border-[#f59e0b]/50'
                                    : 'text-[#f87171] border-[#ef4444]/50'
                              }`}
                            >
                              {result.downloaded === 'baixado'
                                ? 'Salvo'
                                : result.downloaded === 'ignorado'
                                  ? 'Já existe'
                                  : 'Falha'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {result.danbooruImages.length === 0 && !result.danbooruError && (
                      <div className="col-span-3 rounded-lg border p-2 flex flex-col items-center justify-center bg-gray-800">
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                          Nenhuma alternativa encontrada na Danbooru.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {result.status !== 'encontrado' && (
                  <button
                    onClick={() => retryResult(index)}
                    disabled={isSearching}
                    className="px-3 py-1 rounded border border-gray-600 text-gray-400 hover:text-[#e5e7eb] hover:border-[#e5e7eb] transition-colors text-sm disabled:opacity-50"
                  >
                    Pesquisar novamente
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ImageBatchDownload items={downloadItems} />
    </section>
  )
}
