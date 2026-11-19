import { graphqlRequest } from './anilistClient.ts'

export type MatchConfidence = 'provavel' | 'incerta' | 'nao-encontrada'

export type ConfidenceLevel = 'alta' | 'media' | 'baixa'

export interface ScoreBreakdown {
  nome: number
  franquia: number
  nomeAlternativo: number
  resolucao: number
  qualidade: number
  duplicata: number
  incompleto: number
  total: number
}

export interface ImageCandidate {
  id: number
  source: 'anilist'
  name: string
  nativeName: string | undefined
  franchiseDetected: string | null
  imageLarge: string
  imageMedium: string
  resolution: string
  match: MatchConfidence
  matchReason: string
  favourites: number
  score: number
  confidence: ConfidenceLevel
  confidenceReason: string
  scoreBreakdown: ScoreBreakdown
  franchiseMismatch: boolean
  isDuplicate: boolean
  duplicateOf?: number
}

interface RawMediaNode {
  title: { romaji: string; english?: string }
  type: string
}

interface RawCharacter {
  id: number
  name: { full: string; native?: string }
  image: { large: string; medium: string }
  media: { nodes: RawMediaNode[] }
  favourites: number
}

const MIN_PONTUACAO_ALTA = 75
const MIN_PONTUACAO_MEDIA = 40

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

function nameParts(fullName: string): string[] {
  return normalize(fullName).split(' ').filter(Boolean)
}

function scoreNameMatch(queryNorm: string, character: RawCharacter): { score: number; exato: boolean } {
  const full = normalize(character.name.full)
  const native = character.name.native ? normalize(character.name.native) : ''
  const parts = nameParts(character.name.full)
  const first = parts[0] || ''
  const last = parts[parts.length - 1] || ''
  const primeiroEUltimo = `${first} ${last}`.trim()

  if (queryNorm === full || queryNorm === native) return { score: 30, exato: true }
  if (queryNorm === primeiroEUltimo && parts.length > 1) return { score: 20, exato: true }
  if (queryNorm === first || queryNorm === last) return { score: 10, exato: false }
  if (full.includes(queryNorm) || queryNorm.includes(full)) return { score: 5, exato: false }
  if (native && (native.includes(queryNorm) || queryNorm.includes(native))) return { score: 5, exato: false }
  return { score: 0, exato: false }
}

function scoreNomeAlternativo(queryNorm: string, character: RawCharacter, pontuacaoNome: number): number {
  const native = character.name.native ? normalize(character.name.native) : ''
  if (!native || queryNorm === native) return 0
  const parts = nameParts(character.name.full)
  const first = parts[0] || ''
  const last = parts[parts.length - 1] || ''
  const variantes = [first, last, `${first} ${last}`.trim()].filter(Boolean)
  if (variantes.includes(queryNorm) && pontuacaoNome < 20) return 5
  if (native.includes(queryNorm) || queryNorm.includes(native)) return 5
  return 0
}

function scoreFranquia(character: RawCharacter, franchise?: string): { pontos: number; divergente: boolean; confere: boolean } {
  if (!franchise) return { pontos: 10, divergente: false, confere: false }
  const confere = franchiseMatches(character, franchise)
  return confere ? { pontos: 30, divergente: false, confere: true } : { pontos: -25, divergente: true, confere: false }
}

function scoreResolucao(character: RawCharacter): number {
  return Boolean(character.image.large && character.image.medium) ? 10 : 0
}

function scoreQualidade(character: RawCharacter): number {
  let pontos = 0
  if (character.image.large) pontos += 5
  if (character.image.medium) pontos += 5
  return pontos
}

function scoreIncompleto(franchise?: string): number {
  return franchise ? 0 : -10
}

function zerarBreakdown(): ScoreBreakdown {
  return { nome: 0, franquia: 0, nomeAlternativo: 0, resolucao: 0, qualidade: 0, duplicata: 0, incompleto: 0, total: 0 }
}

function finalizeCandidate(candidate: ImageCandidate): void {
  const { id, score, franchiseMismatch, scoreBreakdown } = candidate
  if (id === 0) {
    candidate.match = 'nao-encontrada'
    candidate.confidence = 'baixa'
    candidate.confidenceReason = 'Nenhum personagem encontrado no AniList com este nome.'
    return
  }

  const nomeForte = scoreBreakdown.nome >= 20
  const alta = score >= MIN_PONTUACAO_ALTA && nomeForte && !franchiseMismatch
  candidate.confidence = alta ? 'alta' : score >= MIN_PONTUACAO_MEDIA ? 'media' : 'baixa'
  candidate.match = alta ? 'provavel' : score === 0 ? 'nao-encontrada' : 'incerta'

  if (franchiseMismatch) {
    candidate.confidenceReason = `Possível erro de franquia: detectado "${candidate.franchiseDetected}" (não confere com a busca).`
  } else if (alta) {
    candidate.confidenceReason = `Nome "${candidate.name}" com franquia confirmada (${candidate.franchiseDetected}).`
  } else if (candidate.confidence === 'media') {
    candidate.confidenceReason = 'Provável correspondência, mas recomenda validação manual.'
  } else {
    candidate.confidenceReason = 'Resultado ambíguo ou incompleto; verifique antes de usar.'
  }
}

function buildCandidate(character: RawCharacter, queryNorm: string, franchise?: string): ImageCandidate {
  const franchiseDetected = detectFranchise(character)
  const nome = scoreNameMatch(queryNorm, character)
  const franquia = scoreFranquia(character, franchise)
  const breakdown: ScoreBreakdown = {
    nome: nome.score,
    franquia: franquia.pontos,
    nomeAlternativo: scoreNomeAlternativo(queryNorm, character, nome.score),
    resolucao: scoreResolucao(character),
    qualidade: scoreQualidade(character),
    duplicata: 0,
    incompleto: scoreIncompleto(franchise),
    total: 0,
  }
  let total =
    breakdown.nome +
    breakdown.franquia +
    breakdown.nomeAlternativo +
    breakdown.resolucao +
    breakdown.qualidade +
    breakdown.incompleto
  total = Math.max(0, Math.min(100, total))
  breakdown.total = total

  const exato = nome.score === 30
  let matchReason: string
  if (franchise) {
    if (franquia.confere) {
      matchReason = exato ? 'Nome exato e franquia confirmada.' : 'Nome similar e franquia confirmada.'
    } else {
      matchReason = `Personagem encontrado, mas a franquia "${franchise}" não confere (possível correspondência incorreta). Franquia detectada: ${franchiseDetected || 'desconhecida'}.`
    }
  } else {
    matchReason = exato ? 'Nome exato, mas a franquia não foi informada.' : 'Nome similar, mas a franquia não foi informada.'
  }

  return {
    id: character.id,
    source: 'anilist',
    name: character.name.full,
    nativeName: character.name.native,
    franchiseDetected,
    imageLarge: character.image.large,
    imageMedium: character.image.medium,
    resolution: ANI_LIST_RESOLUTION,
    match: 'incerta',
    matchReason,
    favourites: character.favourites,
    score: total,
    confidence: 'baixa',
    confidenceReason: '',
    scoreBreakdown: breakdown,
    franchiseMismatch: franquia.divergente,
    isDuplicate: false,
  }
}

function markDuplicates(candidates: ImageCandidate[]): void {
  const vistos = new Map<string, ImageCandidate>()
  for (const candidate of candidates) {
    if (candidate.id === 0) continue
    const chave = `${normalize(candidate.name)}|${(candidate.franchiseDetected || '').toLowerCase()}`
    const anterior = vistos.get(chave)
    if (anterior) {
      candidate.isDuplicate = true
      candidate.duplicateOf = anterior.id
      candidate.score = Math.max(0, candidate.score - 10)
    } else {
      vistos.set(chave, candidate)
    }
  }
}

export function scoreCharacter(
  character: RawCharacter,
  query: string,
  franchise?: string,
  siblings: RawCharacter[] = []
): ImageCandidate {
  const queryNorm = normalize(query)
  const lista = [character, ...siblings].map(c => buildCandidate(c, queryNorm, franchise))
  markDuplicates(lista)
  for (const candidate of lista) finalizeCandidate(candidate)
  return lista.find(c => c.id === character.id) ?? lista[0]
}

export function scoreCandidates(characters: RawCharacter[], query: string, franchise?: string): ImageCandidate[] {
  const queryNorm = normalize(query)
  const lista = characters.map(c => buildCandidate(c, queryNorm, franchise))
  markDuplicates(lista)
  for (const candidate of lista) finalizeCandidate(candidate)
  lista.sort((a, b) => b.score - a.score || b.favourites - a.favourites || a.id - b.id)
  return lista
}

const SEARCH_QUERY = `
  query CharacterSearch($search: String) {
    Page(page: 1, perPage: 10) {
      characters(search: $search, sort: FAVOURITES_DESC) {
        id
        name { full native }
        image { large medium }
        media(sort: FAVOURITES_DESC, type: ANIME) {
          nodes { title { romaji english } type }
        }
        favourites
      }
    }
  }
`

const ANI_LIST_RESOLUTION = '230 × 345 px (AniList large)'

function titleContains(node: RawMediaNode, query: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return false
  const romaji = node.title.romaji.toLowerCase()
  const english = node.title.english?.toLowerCase() || ''
  return romaji.includes(q) || english.includes(q)
}

function detectFranchise(character: RawCharacter): string | null {
  const anime = character.media.nodes.find(n => n.type === 'ANIME')
  if (!anime) return null
  return anime.title.english || anime.title.romaji || null
}

function franchiseMatches(character: RawCharacter, franchise?: string): boolean {
  if (!franchise) return false
  return character.media.nodes.some(n => n.type === 'ANIME' && titleContains(n, franchise))
}

export async function searchCharacters(name: string, franchise?: string): Promise<ImageCandidate[]> {
  const trimmed = name.trim()
  if (!trimmed) return []

  const data = await graphqlRequest<{ Page: { characters: RawCharacter[] } }>(SEARCH_QUERY, { search: trimmed })
  const characters = data?.Page?.characters || []

  if (characters.length === 0) {
    const breakdown = zerarBreakdown()
    return [
      {
        id: 0,
        source: 'anilist',
        name: trimmed,
        nativeName: undefined,
        franchiseDetected: null,
        imageLarge: '',
        imageMedium: '',
        resolution: ANI_LIST_RESOLUTION,
        match: 'nao-encontrada',
        matchReason: 'Nenhum personagem encontrado no AniList com este nome.',
        favourites: 0,
        score: 0,
        confidence: 'baixa',
        confidenceReason: 'Nenhum personagem encontrado no AniList com este nome.',
        scoreBreakdown: breakdown,
        franchiseMismatch: false,
        isDuplicate: false,
      },
    ]
  }

  const queryNorm = normalize(trimmed)
  const candidates = characters.map(character => {
    const candidate = buildCandidate(character, queryNorm, franchise)
    finalizeCandidate(candidate)
    return candidate
  })

  markDuplicates(candidates)
  for (const candidate of candidates) finalizeCandidate(candidate)

  candidates.sort((a, b) => b.score - a.score || b.favourites - a.favourites || a.id - b.id)
  return candidates
}
