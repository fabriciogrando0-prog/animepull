import type { Character } from './RarityBadge'
import { RARITY_COLORS } from './RarityBadge'

interface CardFrontProps {
  character: Character
  rarityColor: string
  isHighRarity?: boolean
}

export function CardFront({ character, rarityColor, isHighRarity = false }: CardFrontProps) {
  const sourceAnime = character.media.nodes.find(m => m.type === 'ANIME')
  const animeTitle = sourceAnime?.title.english || sourceAnime?.title.romaji || 'Desconhecido'
  const rarity = character.rarity || 'Comum'
  const colors = RARITY_COLORS[rarity]

  return (
    <div className="absolute inset-0 rounded-2xl border-4 overflow-hidden flex flex-col backface-hidden" style={{
      background: `linear-gradient(145deg, #0a0a12 0%, #121220 30%, #1a1a2e 60%, #0f0f1a 100%)`,
      borderColor: rarityColor,
      boxShadow: `0 0 30px ${rarityColor}80, inset 0 0 60px ${rarityColor}40, 0 20px 40px rgba(0,0,0,0.5)`,
      transform: 'rotateY(180deg)',
      transformStyle: 'preserve-3d',
    }}>
      <div className="relative w-full h-5/6 overflow-hidden">
        {isHighRarity && (
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl" style={{
            background: `linear-gradient(135deg, ${rarityColor}10 0%, transparent 50%, ${colors.secondary}10 100%)`,
            animation: 'holographic 3s ease-in-out infinite',
          }}>
            <div className="absolute inset-0" style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                ${rarityColor}03 2px,
                ${rarityColor}03 4px
              )`,
              animation: 'scanlines 0.1s linear infinite',
            }} />
          </div>
        )}
        <img
          src={character.image.large}
          alt={character.name.full}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
            ❤ {character.favourites.toLocaleString()}
          </span>
        </div>
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
            {rarity}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 min-h-0">
        <h3 className="text-base font-semibold mb-1 line-clamp-2 text-white">
          {character.name.full}
          {character.name.native && (
            <span className="text-xs font-normal text-gray-300 block">
              {character.name.native}
              </span>
          )}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {animeTitle}
        </p>
      </div>
    </div>
  )
}

export function CardBack() {
  return (
    <div className="absolute inset-0 rounded-2xl border-4 overflow-hidden backface-hidden flex flex-col items-center justify-center p-6 text-center" style={{
      background: 'var(--surface)',
      borderColor: 'var(--accent)',
      boxShadow: `0 0 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 60px rgba(0,0,0,0.3)`,
      transformStyle: 'preserve-3d',
    }}>
      <div className="relative mb-8 flex flex-col items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 100 100" className={`drop-shadow-[0_0_20px_var(--accent)]`}>
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#fff' }} />
              <stop offset="100%" style={{ stopColor: '#fff' }} />
            </linearGradient>
          </defs>
          <polygon points="50,5 62,35 95,38 70,60 78,95 50,75 22,95 30,60 5,38 38,35" 
            fill="url(#starGradient)" stroke="var(--accent)" strokeWidth="2" />
        </svg>
        <h2 className="mt-6 text-xl font-bold text-white tracking-widest">ANIMEPULL</h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">BOOSTER PACK</p>
      </div>
      <div className="mt-12 flex flex-col items-center gap-2">
        <p className="text-xs text-gray-500">Clique para revelar</p>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]/70" />
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]/40" />
        </div>
      </div>
    </div>
  )
}
