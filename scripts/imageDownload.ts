import { promises as fs } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  DownloadItem,
  DownloadResult,
  MetadataEntry,
  BatchProgress,
} from '../src/lib/imageDownloadTypes'

const ROOT = resolve(process.cwd())
const IMAGES_DIR = join(ROOT, 'public', 'images', 'characters')
const METADATA_PATH = join(ROOT, 'public', 'images', 'metadata.json')
const MAX_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 30000
const DELAY_MS = 700

type BatchState = {
  status: 'running' | 'done' | 'cancelled'
  total: number
  completed: number
  failed: number
  skipped: number
  current: string | null
  results: DownloadResult[]
  cancelled: boolean
}

const batches = new Map<string, BatchState>()

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function detectFormat(buffer: Buffer): 'png' | 'jpg' | 'webp' | 'gif' | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  const head = buffer.toString('ascii', 0, 6)
  if (head === 'GIF87a' || head === 'GIF89a') return 'gif'
  return null
}

function pngDimensions(buffer: Buffer): { w: number; h: number } | null {
  if (buffer.length < 24) return null
  const w = buffer.readUInt32BE(16)
  const h = buffer.readUInt32BE(20)
  if (w === 0 || h === 0) return null
  return { w, h }
}

async function readMetadata(): Promise<Record<string, MetadataEntry>> {
  try {
    const text = await fs.readFile(METADATA_PATH, 'utf8')
    const data = JSON.parse(text)
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, MetadataEntry>
  } catch {}
  return {}
}

async function writeMetadata(data: Record<string, MetadataEntry>): Promise<void> {
  await fs.writeFile(METADATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function extFor(format: string): string {
  if (format === 'webp') return 'webp'
  if (format === 'jpg') return 'jpg'
  if (format === 'gif') return 'gif'
  return 'png'
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {}
  return false
}

async function downloadOne(item: DownloadItem): Promise<DownloadResult> {
  const base = {
    characterId: item.characterId,
    name: item.name,
  }

  try {
    const pngPath = join(IMAGES_DIR, `${item.characterId}.png`)
    if (await fileExists(pngPath)) {
      return { ...base, status: 'ignorado', error: 'Arquivo já existe' }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const response = await fetch(item.imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AnimePull/1.0' },
    })
    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const chunks: Buffer[] = []
    let total = 0
    const body = response.body as NodeJS.ReadableStream
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of body) {
      total += chunk.length
      if (total > MAX_BYTES) {
        controller.abort()
        throw new Error('Arquivo excede o limite de tamanho (5 MB)')
      }
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const format = detectFormat(buffer)
    if (!format) {
      throw new Error('O arquivo baixado não é uma imagem válida')
    }

    const ext = extFor(format)
    const finalPath = join(IMAGES_DIR, `${item.characterId}.${ext}`)
    if (await fileExists(finalPath)) {
      return { ...base, status: 'ignorado', error: 'Arquivo já existe' }
    }

    await fs.writeFile(finalPath, buffer)

    let resolucao = `${buffer.length} bytes`
    if (format === 'png') {
      const dim = pngDimensions(buffer)
      if (dim) resolucao = `${dim.w} × ${dim.h} px`
    }

    const meta = await readMetadata()
    meta[String(item.characterId)] = {
      id: item.characterId,
      nome: item.name,
      franquia: item.franchise,
      caminhoLocal: `images/characters/${item.characterId}.${ext}`,
      fonte: 'anilist',
      resolucao,
      tamanho: buffer.length,
      formato: format,
      confianca: item.confidence,
      status: 'ok',
      atualizadoEm: new Date().toISOString(),
    }
    await writeMetadata(meta)

    return {
      ...base,
      status: 'baixado',
      path: finalPath,
      format,
      resolucao,
      tamanho: buffer.length,
    }
  } catch (err) {
    return {
      ...base,
      status: 'falha',
      error: err instanceof Error ? err.message : 'Erro ao baixar',
    }
  }
}

export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || ''
  const method = (req.method || 'GET').toUpperCase()
  const base = '/__local/images'

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }

  const send = (status: number, body: unknown): void => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
  }

  const readBody = (): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8')
          resolve(raw.length ? JSON.parse(raw) : {})
        } catch {
          resolve(null)
        }
      })
      req.on('error', reject)
    })

  if (method === 'GET' && url === `${base}/metadata`) {
    try {
      const meta = await readMetadata()
      return send(200, meta)
    } catch {
      return send(500, { error: 'Falha ao ler metadados' })
    }
  }

  if (method === 'POST' && url === `${base}/download`) {
    const body = (await readBody()) as DownloadItem | null
    if (!body || !body.imageUrl) {
      return send(400, { error: 'Requisição inválida' })
    }
    const result = await downloadOne(body)
    return send(200, result)
  }

  if (method === 'POST' && url === `${base}/download-batch`) {
    const body = (await readBody()) as { items: DownloadItem[] } | null
    if (!body?.items?.length) {
      return send(400, { error: 'Itens não informados' })
    }
    const id = crypto.randomUUID()
    const alta = body.items.filter((i) => i.confidence === 'alta')
    batches.set(id, {
      status: 'running',
      total: alta.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      current: null,
      results: [],
      cancelled: false,
    })
    setImmediate(() => runBatch(id, alta))
    return send(200, { batchId: id, total: alta.length })
  }

  if (method === 'GET' && url.startsWith(`${base}/progress`)) {
    const batchId = new URL(url, 'http://localhost').searchParams.get('batchId')
    const state = batchId ? batches.get(batchId) : null
    if (!state) {
      return send(404, { error: 'Lote não encontrado' })
    }
    return send(200, {
      id: state.id,
      status: state.status,
      total: state.total,
      completed: state.completed,
      failed: state.failed,
      skipped: state.skipped,
      current: state.current,
      results: state.results,
    })
  }

  if (method === 'POST' && url === `${base}/cancel`) {
    const body = (await readBody()) as { batchId?: string } | null
    if (body?.batchId) {
      const state = batches.get(body.batchId)
      if (state) state.cancelled = true
    }
    return send(200, { ok: true })
  }

  return false
}

async function runBatch(id: string, items: DownloadItem[]): Promise<void> {
  const state = batches.get(id)
  if (!state) return

  for (const item of items) {
    if (state.cancelled) {
      state.status = 'cancelled'
      break
    }
    state.current = item.name
    const result = await downloadOne(item)
    state.results.push(result)
    if (result.status === 'baixado') state.completed++
    else if (result.status === 'ignorado') state.skipped++
    else state.failed++

    const isLast = item === items[items.length - 1]
    if (!isLast && !state.cancelled) {
      await sleep(DELAY_MS)
    }
  }

  if (!state.cancelled) state.status = 'done'
  state.current = null
}

export { downloadOne }
export { batches }
