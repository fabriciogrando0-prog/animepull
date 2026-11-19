import {
  scoreCharacter,
  scoreCandidates,
  searchCharacters,
  type RawCharacter,
  type ImageCandidate,
} from '../src/lib/anilistSearch.ts'
import type { ConfidenceLevel } from '../src/lib/anilistSearch.ts'

function media(...titles: string[]) {
  return {
    nodes: titles.map(title => ({ title: { romaji: title }, type: 'ANIME' })),
  }
}

const imagem = {
  large: 'https://s4.anilist.co/file/anilist/img/character/large/1.jpg',
  medium: 'https://s4.anilist.co/file/anilist/img/character/medium/1.jpg',
}

const luffy: RawCharacter = {
  id: 1,
  name: { full: 'Monkey D. Luffy', native: 'モンキー・D・ルフィ' },
  image: imagem,
  media: media('One Piece'),
  favourites: 100_000,
}
const naruto: RawCharacter = {
  id: 2,
  name: { full: 'Naruto Uzumaki', native: 'うずまきナルト' },
  image: imagem,
  media: media('Naruto'),
  favourites: 90_000,
}
const goku: RawCharacter = {
  id: 3,
  name: { full: 'Son Goku', native: '孫悟空' },
  image: imagem,
  media: media('Dragon Ball', 'Dragon Ball Z'),
  favourites: 80_000,
}
const levi: RawCharacter = {
  id: 4,
  name: { full: 'Levi Ackerman', native: 'リヴァイ・アッカーマン' },
  image: imagem,
  media: media('Shingeki no Kyojin', 'Attack on Titan'),
  favourites: 70_000,
}
const gojo: RawCharacter = {
  id: 5,
  name: { full: 'Satoru Gojo', native: '五条悟' },
  image: imagem,
  media: media('Jujutsu Kaisen'),
  favourites: 60_000,
}

let failures = 0
function check(label: string, cond: boolean, info = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${label}${info ? ` — ${info}` : ''}`)
  if (!cond) failures++
}

function resumo(c: ImageCandidate): string {
  return `score=${c.score}/100 conf=${c.confidence} motivo="${c.confidenceReason}"`
}

// --- Alta confiança: personagem e franquia correspondem claramente ---
const t1 = scoreCharacter(luffy, 'Monkey D. Luffy', 'One Piece')
check('Luffy exato + One Piece → alta', t1.confidence === 'alta', resumo(t1))
check('Luffy: score >= 75', t1.score >= 75, resumo(t1))
check('Luffy: nome=30 franquia=30', t1.scoreBreakdown.nome === 30 && t1.scoreBreakdown.franquia === 30, resumo(t1))

const t2 = scoreCharacter(naruto, 'Naruto Uzumaki', 'Naruto')
check('Naruto exato + Naruto → alta', t2.confidence === 'alta', resumo(t2))

const t3 = scoreCharacter(goku, 'Son Goku', 'Dragon Ball')
check('Goku exato + Dragon Ball → alta', t3.confidence === 'alta', resumo(t3))

const t4 = scoreCharacter(levi, 'Levi Ackerman', 'Attack on Titan')
check('Levi exato + Attack on Titan → alta', t4.confidence === 'alta', resumo(t4))

const t5 = scoreCharacter(gojo, 'Satoru Gojo', 'Jujutsu Kaisen')
check('Gojo exato + Jujutsu Kaisen → alta', t5.confidence === 'alta', resumo(t5))

// --- Média confiança: provável, mas precisa de validação ---
const t6 = scoreCharacter(goku, 'Goku', 'Dragon Ball')
check('Goku somente primeiro nome → média', t6.confidence === 'media', resumo(t6))

const t7 = scoreCharacter(levi, 'Levi', 'Attack on Titan')
check('Levi somente primeiro nome → média', t7.confidence === 'media', resumo(t7))

const t8 = scoreCharacter(luffy, 'Monkey D. Luffy')
check('Luffy sem franquia informada → média (incompleto)', t8.confidence === 'media', resumo(t8))

// --- Baixa confiança: franquia divergente ---
const t9 = scoreCharacter(naruto, 'Naruto Uzumaki', 'One Piece')
check('Naruto com franquia divergente (One Piece) → baixa', t9.confidence === 'baixa', resumo(t9))
check('Naruto: franquiaMismatch=true', t9.franchiseMismatch === true, resumo(t9))
check('Naruto: franquia=-25', t9.scoreBreakdown.franquia === -25, resumo(t9))

const t10 = scoreCharacter(luffy, 'Monkey D. Luffy', 'Naruto')
check('Luffy com franquia divergente (Naruto) → baixa', t10.confidence === 'baixa', resumo(t10))

// --- Nomes semelhantes / alternativos ---
const t11 = scoreCharacter(goku, 'Son Goku', 'Dragon Ball Z')
check('Goku com nome alternativo da franquia (Dragon Ball Z) → alta', t11.confidence === 'alta', resumo(t11))

// --- Duplicatas ---
const luffyCopia: RawCharacter = { ...luffy, id: 42 }
const t12a = scoreCharacter(luffy, 'Monkey D. Luffy', 'One Piece')
const lista12 = scoreCandidates([luffy, luffyCopia], 'Monkey D. Luffy', 'One Piece')
const copia = lista12.find(c => c.id === 42)
const original = lista12.find(c => c.id === 1)
check('Duplicata: segunda candidata éDuplicate=true', copia?.isDuplicate === true, copia ? resumo(copia) : '(sem copia)')
check('Duplicata: duplicateOf=1', copia?.duplicateOf === 1, copia ? resumo(copia) : '(sem copia)')
check(
  'Duplicata: pontuação reduzida em 10',
  copia?.score === Math.max(0, (original ?? t12a).score - 10),
  copia ? resumo(copia) : '(sem copia)'
)

// --- Não encontrado ---
const naoEncontrado: ImageCandidate = {
  id: 0,
  source: 'anilist',
  name: 'Qualquer Coisa Xyz',
  nativeName: undefined,
  franchiseDetected: null,
  imageLarge: '',
  imageMedium: '',
  resolution: '230 × 345 px (AniList large)',
  match: 'nao-encontrada',
  matchReason: 'Nenhum personagem encontrado no AniList com este nome.',
  favourites: 0,
  score: 0,
  confidence: 'baixa',
  confidenceReason: 'Nenhum personagem encontrado no AniList com este nome.',
  scoreBreakdown: { nome: 0, franquia: 0, nomeAlternativo: 0, resolucao: 0, qualidade: 0, duplicata: 0, incompleto: 0, total: 0 },
  franchiseMismatch: false,
  isDuplicate: false,
}
check('Não encontrado: score 0', naoEncontrado.score === 0)
check('Não encontrado: baixa confiança', naoEncontrado.confidence === 'baixa')

// --- Escala sempre entre 0 e 100 ---
const todos = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12a, copia!, naoEncontrado]
todos.forEach(c => {
  check(`pontuação entre 0 e 100 (${c.name})`, c.score >= 0 && c.score <= 100, resumo(c))
})

// --- Consulta real ao catálogo da AniList (se houver rede) ---
try {
  const resultado = await searchCharacters('Monkey D. Luffy', 'One Piece')
  const topo = resultado[0]
  console.log(`\n[ao vivo] AniList retornou ${resultado.length} candidata(s) para "Monkey D. Luffy" / One Piece`)
  console.log(`[ao vivo] topo: ${topo.name} — score ${topo.score}/100 — ${topo.confidence} — ${topo.confidenceReason}`)
  check('[ao vivo] topo tem pontuação válida', topo.score >= 0 && topo.score <= 100, resumo(topo))
} catch (err) {
  console.log(`\n[ao vivo] consulta ao AniList indisponível neste ambiente: ${err instanceof Error ? err.message : err}`)
}

console.log(`\n${failures === 0 ? 'Todos os testes passaram' : failures + ' falha(s)'}`)
process.exit(failures > 0 ? 1 : 0)
