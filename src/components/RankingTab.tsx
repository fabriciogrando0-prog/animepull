import type { Character, Rarity } from './RarityBadge'
import { CharacterCard } from './CharacterCard'
import { RarityBadge } from './RarityBadge'

interface RankingTabProps {
  characters: Character[]
  getRarityStats: () => Array<{ rarity: Rarity; count: number; weight: number }>
}

export function RankingTab({ characters, getRarityStats }: RankingTabProps) {
  return (
    <div className="space-y-12 text-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Tabela de Raridades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {['Mítico', 'Lendário', 'Épico', 'Raro', 'Incomum', 'Comum'].map(rarity => (
            <RarityBadge key={rarity} rarity={rarity as Rarity} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Estatísticas do Pool Atual</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {getRarityStats().map(({ rarity, count, weight }) => {
            return (
              <div key={rarity} className="p-4 rounded-lg border border-gray-700 bg-[#0b0b14]/50 text-center">
                <div className="text-3xl font-bold text-white">{count}</div>
                <div className="text-sm font-medium text-gray-300">{rarity}</div>
                <div className="text-xs text-gray-500">{weight}% chance</div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Top {Math.min(50, characters.length)} Personagens</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {characters.slice(0, 50).map(character => (
            <CharacterCard key={character.id} character={character} showRarity={true} />
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Dados fornecidos por <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">AniList</a></p>
        <p className="mt-1">Cache válido por 24 horas • {characters.length} personagens carregados • Conteúdo adulto filtrado</p>
      </div>
    </div>
  )
}
