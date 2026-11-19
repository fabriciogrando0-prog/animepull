import { graphqlRequest } from './anilistClient'

export type MatchConfidence = 'provavel' | 'incerta' | 'nao-encontrada'

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
      },
    ]
  }

  return characters.map(character => {
    const franchiseDetected = detectFranchise(character)
    const exactName = character.name.full.toLowerCase() === trimmed.toLowerCase()
    const matchedFranquia = franchiseMatches(character, franchise)

    let match: MatchConfidence
    let matchReason: string

    if (franchise) {
      if (matchedFranquia) {
        match = 'provavel'
        matchReason = exactName ? 'Nome exato e franquia confirmada.' : 'Nome similar e franquia confirmada.'
      } else {
        match = 'incerta'
        matchReason = `Personagem encontrado, mas a franquia "${franchise}" não confere (possível correspondência incorreta). Franquia detectada: ${franchiseDetected || 'desconhecida'}.`
      }
    } else {
      match = 'incerta'
      matchReason = exactName ? 'Nome exato, mas a franquia não foi informada.' : 'Nome similar, mas a franquia não foi informada.'
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
      match,
      matchReason,
      favourites: character.favourites,
    }
  })
}
