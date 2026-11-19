export type DownloadStatus = 'baixado' | 'ignorado' | 'falha' | 'cancelado'

export interface DownloadItem {
  characterId: number
  name: string
  franchise: string | null
  imageUrl: string
  confidence: 'alta' | 'media' | 'baixa'
  score: number
}

export interface DownloadResult {
  characterId: number
  name: string
  status: DownloadStatus
  path?: string
  format?: string
  resolucao?: string
  tamanho?: number
  error?: string
}

export interface MetadataEntry {
  id: number
  nome: string
  franquia: string | null
  caminhoLocal: string
  fonte: 'anilist'
  resolucao: string
  tamanho: number
  formato: string
  confianca: 'alta' | 'media' | 'baixa'
  status: 'ok'
  atualizadoEm: string
}

export interface BatchProgress {
  id: string
  status: 'running' | 'done' | 'cancelled'
  total: number
  completed: number
  failed: number
  skipped: number
  current: string | null
  results: DownloadResult[]
}
