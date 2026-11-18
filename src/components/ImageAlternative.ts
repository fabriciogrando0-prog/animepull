export interface ImageAlternative {
  characterId: number
  url: string
  registeredAt: number
}

export const IMAGE_ALTERNATIVE_KEY = 'animepull_image_alternatives'

export function getImageAlternatives(): ImageAlternative[] {
  try {
    const stored = localStorage.getItem(IMAGE_ALTERNATIVE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
  }
  return []
}

export function hasImageAlternative(characterId: number): boolean {
  return getImageAlternatives().some(alt => alt.characterId === characterId)
}
