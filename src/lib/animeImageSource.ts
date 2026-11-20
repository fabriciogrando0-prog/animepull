const DANBOORU_BASE = '/api/danbooru'
const MAX_RESULTS = 6
const MIN_WIDTH = 300
const MIN_HEIGHT = 300

export interface DanbooruImage {
  id: number
  source: 'danbooru'
  url: string
  previewUrl: string
  width: number
  height: number
  rating: string
  score: number
  tags: string[]
  characterId: number
  franchise: string | null
}

export interface DanbooruSearchResult {
  images: DanbooruImage[]
  error?: string
}

function normalizeTag(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w]/g, '')
}

export async function searchDanbooruImages(
  characterName: string,
  franchise: string | null,
  characterId: number
): Promise<DanbooruSearchResult> {
  if (!franchise) {
    return { images: [], error: 'Franquia não identificada. Não é possível buscar na Danbooru.' }
  }

  const charTag = normalizeTag(characterName)
  const franchiseTag = normalizeTag(franchise)
  const tags = `${charTag} ${franchiseTag} rating:safe`

  try {
    const response = await fetch(
      `${DANBOORU_BASE}/posts.json?tags=${encodeURIComponent(tags)}&limit=20`
    )

    if (!response.ok) {
      return { images: [], error: `Erro na Danbooru: HTTP ${response.status}` }
    }

    const data = await response.json()
    const posts = Array.isArray(data) ? data : []

    const images: DanbooruImage[] = []
    const seenUrls = new Set<string>()

    for (const post of posts) {
      if (images.length >= MAX_RESULTS) break

      const fileUrl = post.file_url || post.large_file_url || post.preview_file_url
      if (!fileUrl || seenUrls.has(fileUrl)) continue

      const rating = post.rating
      if (rating !== 's') continue

      const width = post.image_width || 0
      const height = post.image_height || 0
      if (width < MIN_WIDTH || height < MIN_HEIGHT) continue

      seenUrls.add(fileUrl)

      images.push({
        id: post.id,
        source: 'danbooru',
        url: fileUrl,
        previewUrl: post.preview_file_url || fileUrl,
        width,
        height,
        rating,
        score: post.score || 0,
        tags: post.tag_string ? post.tag_string.split(' ') : [],
        characterId,
        franchise,
      })
    }

    images.sort((a, b) => b.score - a.score || (b.width * b.height) - (a.width * a.height))

    return { images: images.slice(0, MAX_RESULTS) }
  } catch (err) {
    return {
      images: [],
      error: err instanceof Error ? err.message : 'Erro ao buscar na Danbooru.',
    }
  }
}
