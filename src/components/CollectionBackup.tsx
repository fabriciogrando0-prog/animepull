import { useCallback, useRef, useState } from 'react'
import type { Character } from './RarityBadge'

const COLLECTION_KEY = 'animepull_collection'

interface BackupFile {
  app: string
  version: number
  exportedAt: string
  collection: Character[]
}

export function CollectionBackup() {
  const [status, setStatus] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExport = useCallback(() => {
    try {
      const stored = localStorage.getItem(COLLECTION_KEY)
      const collection: Character[] = stored ? JSON.parse(stored) : []
      if (!Array.isArray(collection) || collection.length === 0) {
        setStatus('Coleção vazia, nada para exportar')
        return
      }
      const backup: BackupFile = {
        app: 'animepull',
        version: 1,
        exportedAt: new Date().toISOString(),
        collection,
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      })
      const date = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `animepull-colecao-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus(`${collection.length} cartas exportadas`)
    } catch {
      setStatus('Erro ao exportar')
    }
  }, [])

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data: unknown = JSON.parse(text)
        const bf = data as BackupFile
        if (
          bf.app !== 'animepull' ||
          bf.version !== 1 ||
          !Array.isArray(bf.collection)
        ) {
          setStatus('Arquivo inválido')
          return
        }
        const valid = bf.collection.every(
          (item: Character) =>
            typeof item.id === 'number' &&
            Boolean(item.name?.full) &&
            Boolean(item.image?.large)
        )
        if (!valid) {
          setStatus('Arquivo inválido')
          return
        }
        try {
          const current: Character[] = JSON.parse(
            localStorage.getItem(COLLECTION_KEY) || '[]'
          )
          const existingIds = new Set(current.map(c => c.id))
          const novas = bf.collection.filter(
            (c: Character) => !existingIds.has(c.id)
          )
          localStorage.setItem(COLLECTION_KEY, JSON.stringify([...current, ...novas]))
          setStatus(`${novas.length} cartas novas importadas`)
          setTimeout(() => window.location.reload(), 1000)
        } catch {
          setStatus('Erro ao gravar coleção')
        }
      } catch {
        setStatus('Arquivo inválido')
      }
    },
    []
  )

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4">
      <div className="flex flex-col gap-2 w-full max-w-xs @(390px):flex-row">
        <button
          onClick={handleExport}
          className="px-4 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--bg)] rounded-xl hover:bg-[var(--accent2)]/90 transition-all"
        >
          Exportar coleção
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 py-1.5 text-xs font-medium text-[var(--accent)] bg-[var(--surface)] border border-[var(--accent2)]/30 rounded-xl hover:bg-[var(--accent2)]/10 transition-all"
        >
          Importar coleção
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
      {status && <p className="text-xs text-[var(--muted)]">{status}</p>}
    </div>
  )
}
