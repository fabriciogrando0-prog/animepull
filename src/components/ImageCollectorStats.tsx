interface ImageCollectorStatsProps {
  total: number
  withImage: number
  withoutImage: number
  anilistOriginal: number
}

export function ImageCollectorStats({ total, withImage, withoutImage, anilistOriginal }: ImageCollectorStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-lg border border-gray-800 bg-[#0b0b14]/40">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total de personagens</div>
        <div className="text-2xl font-bold">{total.toLocaleString('pt-BR')}</div>
      </div>
      <div className="p-4 rounded-lg border border-gray-800 bg-[#0b0b14]/40">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Com imagem</div>
        <div className="text-2xl font-bold text-[#34d399]">{withImage.toLocaleString('pt-BR')}</div>
      </div>
      <div className="p-4 rounded-lg border border-gray-800 bg-[#0b0b14]/40">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sem imagem</div>
        <div className="text-2xl font-bold text-[#f87171]">{withoutImage.toLocaleString('pt-BR')}</div>
      </div>
      <div className="p-4 rounded-lg border border-gray-800 bg-[#0b0b14]/40">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Imagem original da AniList</div>
        <div className="text-2xl font-bold text-[#fbbf24]">{anilistOriginal.toLocaleString('pt-BR')}</div>
      </div>
    </div>
  )
}
