import { useState, useRef, useEffect, useCallback } from 'react'
import type { DownloadItem } from '../lib/imageDownloadTypes'
import type { DownloadResult } from '../lib/imageDownloadTypes'

const API = '/__local/images'

interface ImageBatchDownloadProps {
  items: DownloadItem[]
  onChange?: (results: DownloadResult[]) => void
}

export function ImageBatchDownload({ items, onChange }: ImageBatchDownloadProps) {
  const [batch, setBatch] = useState<{
    id: string
    status: 'running' | 'done' | 'cancelled'
    total: number
    completed: number
    failed: number
    skipped: number
    current: string | null
    results: DownloadResult[]
  } | null>(null)
  const [downloadingIndividual, setDownloadingIndividual] = useState<Set<number>>(new Set())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const alta = items.filter((i) => i.confidence === 'alta')

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  const startBatch = async () => {
    const res = await fetch(`${API}/download-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: alta }),
    })
    const data = await res.json()
    setBatch({
      id: data.batchId,
      status: 'running',
      total: data.total,
      completed: 0,
      failed: 0,
      skipped: 0,
      current: null,
      results: [],
    })
    pollRef.current = setInterval(async () => {
      const progressRes = await fetch(`${API}/progress?batchId=${data.batchId}`)
      const progress = await progressRes.json()
      setBatch(progress)
      if (progress.status !== 'running') {
        stopPolling()
      }
      onChange?.(progress.results)
    }, 500)
  }

  const cancelBatch = async () => {
    if (batch?.id) {
      await fetch(`${API}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id }),
      })
    }
    stopPolling()
    setBatch((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
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
      onChange?.([result])
      return result
    } catch {
      const failed: DownloadResult = {
        characterId: item.characterId,
        name: item.name,
        status: 'falha',
        error: 'Erro ao baixar',
      }
      onChange?.([failed])
      return failed
    } finally {
      setDownloadingIndividual((prev) => {
        const next = new Set(prev)
        next.delete(item.characterId)
        return next
      })
    }
  }

  if (!alta.length) {
    return (
      <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6 mt-6">
        <h3 className="text-md font-semibold mb-2">Download de imagens</h3>
        <p className="text-gray-500 text-sm mb-3">
          Nenhum candidato de alta confiança disponível para download automático.
        </p>
        {items.length > 0 && (
          <p className="text-xs text-gray-500">
            Candidatos de m\u00e9dia ou baixa confian\u00e7a n\u00e3o s\u00e3o baixados automaticamente.
          </p>
        )}
      </section>
    )
  }

  const completed = batch?.completed ?? 0
  const failed = batch?.failed ?? 0
  const skipped = batch?.skipped ?? 0
  const total = batch?.total ?? alta.length
  const processed = completed + failed + skipped
  const pct = total ? Math.round((processed / total) * 100) : 0

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b0b14]/50 p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-md font-semibold">Download de imagens</h3>
        <span className="px-2 py-0.5 rounded text-xs font-medium border border-[#fbbf24] text-[#fbbf24]">
          Somente alta confian\u00e7a
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        Baixa automaticamente os candidatos de alta confian\u00e7a do lote. Nunca sobrescreve imagens existentes.
        M\u00e9dia e baixa confian\u00e7a exigem aprova\u00e7\u00e3o manual individual.
      </p>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Progresso</span>
          <span className="text-xs text-[#e5e7eb]">{processed} / {total}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-[#fbbf24] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded border border-[#16a34a]/30 bg-[#16a34a]/10">
            <div className="text-[#4ade80] font-bold">{completed}</div>
            <div className="text-[#4ade80]/70 text-[10px]">Conclu\u00eddo</div>
          </div>
          <div className="p-2 rounded border border-[#ef4444]/30 bg-[#ef4444]/10">
            <div className="text-[#f87171] font-bold">{failed}</div>
            <div className="text-[#f87171]/70 text-[10px]">Falhas</div>
          </div>
          <div className="p-2 rounded border border-[#f59e0b]/30 bg-[#f59e0b]/10">
            <div className="text-[#fbbf24] font-bold">{skipped}</div>
            <div className="text-[#fbbf24]/70 text-[10px]">Ignoradas</div>
          </div>
        </div>
      </div>

      {batch?.status === 'running' && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">{batch.current ? `Baixando: ${batch.current}` : 'Iniciando...'}</p>
          <button
            onClick={cancelBatch}
            className="px-4 py-2 rounded border border-[#ef4444] text-[#fca5a5] hover:bg-[#ef4444]/10 transition-colors"
          >
            Interromper processamento
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={startBatch}
          disabled={batch?.status === 'running'}
          className="px-4 py-2 rounded border border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {batch?.status === 'running' ? 'Processando...' : 'Baixar alta confian\u00e7a'}
        </button>
        {(batch?.status === 'done' || batch?.status === 'cancelled') && (
          <button
            onClick={() => setBatch(null)}
            className="px-4 py-2 rounded border border-gray-600 text-gray-400 hover:text-[#e5e7eb] transition-colors"
          >
            Novo lote
          </button>
        )}
      </div>

      {batch && batch.results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg text-sm">
          {batch.results.map((r) => {
            const isOk = r.status === 'baixado'
            return (
              <div
                key={r.characterId}
                className="border-b border-gray-800 p-2 flex justify-between items-start"
              >
                <span className="text-gray-400 truncate max-w-[220px]">{r.name}</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isOk
                        ? 'text-[#4ade80] border-[#16a34a]/50'
                        : r.status === 'ignorado'
                          ? 'text-[#fbbf24] border-[#f59e0b]/50'
                          : 'text-[#f87171] border-[#ef4444]/50'
                    }`}
                  >
                    {isOk ? 'Conclu\u00eddo' : r.status === 'ignorado' ? 'Ignorada' : 'Falha'}
                  </span>
                  {!isOk && r.error && (
                    <span className="text-[#f87171]/70 text-[10px] ml-1">{r.error}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 border-t border-gray-800 pt-3">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Download individual</h4>
        <p className="text-xs text-gray-500 mb-3">
          Baixe um candidato individual. M\u00e9dia/baixa confian\u00e7a pede confirma\u00e7\u00e3o antes de baixar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const isAlta = item.confidence === 'alta'
            return (
              <div key={item.characterId} className="rounded-lg border border-gray-700 bg-gray-900 p-3 flex flex-col gap-2">
                <h4 className="text-sm font-semibold line-clamp-1 text-[#e5e7eb]">{item.name}</h4>
                <p className="text-xs text-gray-500 truncate mb-2">{item.franchise || '—'}</p>
                <button
                  onClick={() => downloadOne(item)}
                  disabled={downloadingIndividual.has(item.characterId)}
                  className="w-full px-3 py-2 rounded border text-sm transition-colors ${
                    isAlta
                      ? 'border-[#e5e7eb] text-[#e5e7eb] hover:bg-[#e5e7eb]/10'
                      : 'border-gray-600 text-gray-600'
                  }"
                >
                  {downloadingIndividual.has(item.characterId)
                    ? 'Baixando...'
                    : isAlta
                      ? 'Baixar'
                      : 'Aprovar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
