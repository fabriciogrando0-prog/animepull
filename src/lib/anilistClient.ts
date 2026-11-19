const API_URL = '/api/anilist'
const USER_AGENT = 'AnimePull/1.0 (https://github.com/anilist/anilist-api)'
const MAX_RETRIES = 3

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)
  let lastError: unknown

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      })

      if (response.status === 429) {
        await sleep(1000 * (i + 1))
        continue
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
      }

      const result = (await response.json()) as GraphQLResponse<T>

      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '))
      }

      if (!result.data) {
        throw new Error('Resposta vazia da AniList')
      }

      return result.data
    } catch (err) {
      lastError = err
      if (i === MAX_RETRIES - 1) break
      await sleep(1000 * (i + 1))
    }
  }

  clearTimeout(timeoutId)
  throw lastError
}
