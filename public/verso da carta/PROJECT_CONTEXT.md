# PROJECT_CONTEXT.md - AnimePull

> Documentação técnica do projeto AnimePull. Destinado a permitir que uma nova IA continue o desenvolvimento sem depender do histórico anterior.
>
> **Status do projeto:** MVP em desenvolvimento. Apenas o sistema de abertura de packs está funcional.

---

## 1. Objetivo e Funcionamento Geral

**AnimePull** é um jogo de abertura de packs (gacha-style) baseado nos personagens mais favoritados do [AniList](https://anilist.co). O usuário abre packs contendo 5 cartas aleatórias, cada uma com uma raridade determinada pelo ranking de popularidade do personagem no AniList. As cartas obtidas são adicionadas a uma coleção local.

### Fluxo principal

1. Ao abrir o jogo, os 500 personagens mais favoritados do AniList são carregados (10 páginas × 50, via GraphQL).
2. Conteúdo adulto (`isAdult`) é filtrado.
3. Cada personagem recebe uma raridade com base na posição no ranking ordenado por `favourites` (descendente).
4. O usuário seleciona um tema de pack (set visual) e clica em "Abrir Pack".
5. O sistema sorteia 5 caracteres: primeiro escolhe a raridade pelos pesos (`RARITY_WEIGHTS`), depois escolhe um personagem aleatório do pool dessa raridade.
6. Animação de rasgo do pack → revelação das cartas uma a uma (pilha) → tela de resumo.
7. As cartas são salvas na coleção local (sem duplicatas por `id`).

### Telas/Abas

- **Packs** — Abrir packs, trocar de tema.
- **Coleção** — Placeholder ("Em breve"). Não está implementada.
- **Ranking** — Tabela de raridades, estatísticas do pool atual, top 50 personagens.

---

## 2. Arquitetura e Tecnologias

### Stack

| Camada | Tecnologia | Versão (package.json) |
|--------|-----------|----------------------|
| Framework | React | ^19.3.1 |
| Renderização | React DOM | ^19.3.1 |
| Build tool / bundler | Vite | ^8.3.6 |
| Linguagem | TypeScript | ~7.0.2 |
| Estilização | Tailwind CSS | ^4.3.5 (via `@tailwindcss/vite` + postcss) |
| Animações | Framer Motion | ^14.13.0 |
| API externa | AniList GraphQL | via proxy do Vite (`/api/anilist` → `https://graphql.anilist.co`) |
| Persistência | `localStorage` (navegador) | — |

### Arquitetura

- **SPA de página única**, entrada em `index.html` → `src/main.tsx` → `src/App.tsx`.
- Estado centralizado em `App.tsx` (personagens, pools por raridade, coleção, aba ativa, telas modais).
- Contextos React: `ThemeProvider` (temas visuais) e `EffectsProvider` (efeitos ligados/desligados).
- Componentes funcionais com hooks (`useState`, `useEffect`, `useCallback`, `useRef`, `useContext`).
- Animações CSS em `src/style.css` + Framer Motion para componentes animados.
- Proxy do Vite contorna CORS da AniList e injeta `User-Agent: AnimePull/1.0`.

### Arquitetura de dados (cliente)

Não há banco de dados nem backend. Tudo é mantido em `localStorage`:

| Chave | Conteúdo | Duração |
|-------|----------|---------|
| `anilist_500_characters` | `{ characters, timestamp }` | 24h (`CACHE_DURATION`) |
| `animepull_collection` | `Character[]` (coleção do usuário) | Persistente |
| `animepull.effects` | `"true"`/`"false"` | Persistente |

---

## 3. Estrutura de Pastas e Arquivos Importantes

```
animepull/
├── index.html                  # Página de entrada (div#app, script /src/main.tsx)
├── package.json                # Dependências e scripts (dev/build/preview)
├── package-lock.json
├── tsconfig.json               # TypeScript: ES2023, React JSX, noEmit, strict
├── vite.config.ts              # Vite + React + Tailwind; proxy /api/anilist
├── .gitignore
├── public/
│   ├── favicon.svg
│   ├── icons.svg               # SVG sprite (ícones sociais, não usados no jogo)
│   ├── matsuri-pack.png        # Não referenciado no código (arquivo órfão)
│   ├── packs/                  # 10 imagens de pack (.webp), 1 por tema
│   ├── molduras/               # 6 molduras de carta (.webp) + frames.json
│   │   ├── frame-comum.webp
│   │   ├── frame-incomum.webp
│   │   ├── frame-epico.webp
│   │   ├── frame-lendario.webp
│   │   ├── frame-mitico.webp
│   │   ├── frame-raro.webp
│   │   ├── frames.json         # Geometria das molduras (canvas 1024x1536)
│   │   └── _preview.png
│   │   └── files/              # Diretório vazio
│   └── verso da carta/         # Imagens de verso de carta (.png), NÃO referenciadas no código
├── dist/                       # Build de produção (gerado, ignorado pelo git)
├── node_modules/
└── src/
    ├── main.tsx                # Entry point (ReactDOM.createRoot, providers)
    ├── App.tsx                 # Componente raiz: fetch AniList, raridades, lógica de pull, coleção
    ├── style.css               # Tailwind import + animações CSS globais
    ├── assets/                 # hero.png, typescript.svg, vite.svg (não usados)
    ├── components/
    │   ├── AppShell.tsx        # Cabeçalho + navegação (3 abas: Packs, Coleção, Ranking)
    │   ├── PacksTab.tsx        # Tela Packs: arte do pack, botão Abrir, trocar tema
    │   ├── ColecaoTab.tsx      # Placeholder "Em breve" (não implementado)
    │   ├── RankingTab.tsx      # Tabela de raridades, estatísticas, top 50 personagens
    │   ├── PackOpeningScreen.tsx # Fluxo de abertura (fases: pack → stack → summary)
    │   ├── SummaryScreen.tsx   # Tela de resumo do pack aberto
    │   ├── CharacterCard.tsx   # Card de personagem (usado no Ranking)
    │   ├── CardFront.tsx       # Face da carta + wrapper CardBack (tema)
    │   ├── FlipCard.tsx        # Card com animação de virar — NÃO importado em lugar nenhum (código morto)
    │   ├── PackSlotsPanel.tsx  # Painel dos 5 slots do pack + contador da coleção
    │   ├── TearablePack.tsx    # Animação de rasgar o pack (arrasto/clique, partículas)
    │   ├── StackPhase.tsx      # Fase de revelação da pilha de cartas (virar/guardar)
    │   ├── Particle.tsx        # Partícula individual (framer-motion)
    │   ├── FrameFX.tsx         # Efeitos de partículas nas bordas por raridade
    │   ├── RarityFrame.tsx     # Moldura da carta com borda, brilho e FX por raridade
    │   ├── EffectsContext.tsx  # Contexto de efeitos visuais ligados/desligados (localStorage)
    │   ├── LoadingSkeleton.tsx # Placeholder de carregamento — NÃO importado (código morto)
    │   ├── PackArt.tsx         # Wrapper do componente de arte do pack do tema
    │   └── RarityBadge.tsx     # TIPOS (Character, Rarity), constantes de raridade, badge de raridade, getHighestRarity
    └── themes/
        ├── ThemeContext.tsx    # Contexto de tema (tema atual, nextTheme, CSS vars)
        ├── types.ts            # Interfaces Palette e Theme
        ├── index.ts            # 10 temas definidos + pickRandomTheme
        ├── CardBack.tsx        # Verso da carta genérico (usa imagem do pack do tema)
        └── PackArt.tsx         # Componente de arte do pack (botão com tilt 3D)
```

### Temas disponíveis (10)

Definidos em `src/themes/index.ts`, cada um com `id`, `name`, `arquivo` (imagem do pack), `palette` (bg, surface, accent, accent2, text, muted) e componentes `PackArt`/`CardBack`:

1. `manga-pop` — Manga Pop
2. `shounen` — Shounen
3. `shoujo` — Shoujo
4. `seinen` — Seinen
5. `josei` — Josei
6. `isekai` — Isekai
7. `mecha` — Mecha
8. `esportes` — Esportes
9. `sobrenatural` — Sobrenatural
10. `slice` — Slice of Life

---

## 4. Sistemas Já Implementados

### 4.1 Carregamento de dados da AniList (`App.tsx`)

- Consulta GraphQL fixa (`GRAPHQL_QUERY`) buscando `Page(page, perPage)` com `characters(sort: FAVOURITES_DESC)`.
- Campos buscados: `id`, `name.full`, `name.native`, `image.large`, `image.medium`, `media.nodes{title{romaji,english}, type, isAdult}`, `favourites`.
- Paginação: 10 páginas × 50 = 500 personagens, com delay de 300ms entre páginas (`PAGE_DELAY`).
- Retry automático (3 tentativas) com backoff em `fetchWithRetry`; trata HTTP 429 (rate limit) e erros de rede/CORS.
- Filtro de conteúdo adulto: remove personagens que possuem qualquer mídia com `isAdult === true`.
- Cache em `localStorage` (`anilist_500_characters`) válido por 24h.

### 4.2 Sistema de raridade (`RarityBadge.tsx`)

**Tipos:**
```ts
type Rarity = 'Comum' | 'Incomum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico'
```

**Atribuição de raridade (`assignRarities`):**
Personagens ordenados por `favourites` desc; raridade pelo índice no ranking ordenado:

| Rarity | Posição (start–end) | Quantidade |
|--------|---------------------|------------|
| Mítico | 0–4 | 5 |
| Lendário | 5–24 | 20 |
| Épico | 25–74 | 50 |
| Raro | 75–174 | 100 |
| Incomum | 175–324 | 150 |
| Comum | 325–499 | 175 |

**Probabilidades de pull (`RARITY_WEIGHTS`):**
| Rarity | Peso |
|--------|------|
| Comum | 55% |
| Incomum | 25% |
| Raro | 12% |
| Épico | 5% |
| Lendário | 2.5% |
| Mítico | 0.5% |

Função `rollRarity()` sorteia raridade acumulativa; `drawCharacter()` pega um personagem aleatório do pool da raridade sorteada, com fallback para outras raridades se o pool estiver vazio. `drawMultiple()` repete N vezes (usado com `count = 5` para um pack).

`getHighestRarity(cards)` retorna a raridade mais alta entre as cartas (ordem: Comum < Incomum < Raro < Épico < Lendário < Mítico).

### 4.3 Abertura de packs (`App.tsx`, `PackOpeningScreen.tsx`, `TearablePack.tsx`, `StackPhase.tsx`)

- `handleOpenPack` avança o tema (`nextTheme`) e sorteia 5 cartas.
- Tela de abertura tem 3 fases: `pack` (rasgo) → `stack` (revelação pilha) → `summary` (resumo).
- `TearablePack`: arrasto ou clique para rasgar; linha de rasgo dentada; animações de luz, feixes, partículas (contagem varia por raridade; Mítico = 50); tecla Espaço também rasga.
- `StackPhase`: cartas ordenadas por raridade (menor → maior); usuário vira (Espaço/clique) e guarda a carta; animações de brilho/partículas por raridade (Raro, Épico, Lendário, Mítico); botão "Pular" com confirmação; flash de tela para Mítico/Lendário.
- `SummaryScreen`: exibe as 5 cartas com moldura de raridade, título do anime, favs, indicação "X Pull Detectado!" (raridade mais alta); botões "Abrir Outro Pack" e "Fechar".

### 4.4 Coleção (`App.tsx`, `PackSlotsPanel.tsx`)

- `getCollection()` / `addToCollection()` leem/escrevem `animepull_collection` em `localStorage`, dedupando por `id`.
- `PackSlotsPanel` mostra os 5 slots (preenchidos com imagem da carta, verso para vazios) e o contador de cartas distintas na coleção.
- `StackPhase.handleFlip` chama `onSave(card)` que adiciona à coleção se ainda não existir.

### 4.5 Ranking (`RankingTab.tsx`)

- Exibe `RarityBadge` para cada raridade (peso, chance, posição no ranking, qtde de chars).
- Estatísticas do pool atual (qtd por raridade e peso %).
- Top 50 personagens com `CharacterCard` (imagem, favs, título do anime, badge de raridade).
- Rodapé com crédito à AniList, info de cache e filtro adulto.

### 4.6 Temas visuais (`themes/`)

- `ThemeContext` expõe `theme` e `nextTheme()`; aplica variáveis CSS (`--bg`, `--surface`, `--accent`, `--accent2`, `--text`, `--muted`) no `:root`.
- `pickRandomTheme(excludeId)` sorteia um tema diferente do atual.
- Cada tema tem paleta própria, imagem de pack e componentes `PackArt`/`CardBack` compartilhados.
- `PackArt`: botão com efeito de tilt 3D ao mover o mouse, animação de flutuação, fallback de erro.
- `CardBack`: verso genérico com imagem do pack do tema e gradiente da paleta.

### 4.7 Efeitos visuais

- `EffectsContext`: ligar/desligar efeitos, persistido em `localStorage` (`animepull.effects`), padrão `true`.
- `RarityFrame`: moldura por raridade (imagem `.webp` de `public/molduras/`), brilho animado (`frame-pulse`, `frame-pulse-hue`, `frame-opacity`), fallback de borda se a imagem falhar (`frameFailed`).
- `FrameFX`: partículas animadas nas bordas da carta conforme raridade (Incomum=leaves, Raro=sparkles, Épico=orbs, Lendário=sparks, Mítico=embers); gerador de números aleatórios determinístico (seed baseado em raridade/intensidade).
- `style.css`: keyframes para flutuar, brilho, scanlines, partículas, pulso de moldura, shake de tela, flash, luz de pack, etc.

---

## 5. Sistemas em Desenvolvimento / Planejados (não implementados)

Os seguintes itens são **mencionados no código ou interface, mas não estão implementados**:

| Item | Evidência no código | Status |
|------|---------------------|--------|
| **Coleção** | `ColecaoTab.tsx` retorna apenas `<p>Em breve</p>`; `AppShell` exibe "Coleção: X" no `PackSlotsPanel` | Não implementada (apenas contador) |
| **Painel administrativo** | Nenhuma referência a `admin` no código-fonte | Não existe |
| **Banco de dados** | Nenhuma referência a DB/ORM/backend; apenas `localStorage` | Não existe |
| **Autenticação/usuários** | Nenhuma referência | Não existe |
| **Moedas/currency** | Cabeçalho exibe "Moedas: 0" mas nunca é alterado nem usado | Placeholder estático |
| **Transformações de personagens** | Nenhuma referência a transformação, evolução, forma alternativa | Não existe |
| **Raridade dinâmica baseada em sorteio separado** | `RARITY_WEIGHTS` define chance de pull, mas não há sistema separado de "taxa de up" | Implementado parcialmente (apenas o roll de raridade) |
| **FlipCard** | Componente completo em `FlipCard.tsx` mas nunca importado | Código morto / não integrado |
| **LoadingSkeleton** | Componente completo mas nunca importado | Código morto / não integrado |
| **Imagens de verso da carta** (`public/verso da carta/`) | 13 imagens PNG, nenhuma referenciada no código | Arquivos órfãos |
| **matsuri-pack.png** | `public/matsuri-pack.png`, nenhuma referência no código | Arquivo órfão |

---

## 6. Banco de Dados e Relacionamentos

**Não há banco de dados.** O projeto é um SPA totalmente frontend que usa exclusivamente `localStorage` do navegador para persistência. Não há schema, tabelas, relacionamentos, migrations nem ORM.

Estruturas de dados em memória (TypeScript, em `RarityBadge.tsx`):

```ts
interface Character {
  id: number
  name: { full: string; native?: string }
  image: { large: string; medium: string }
  media: { nodes: [{ title: { romaji: string; english?: string }; type: string; isAdult?: boolean }] }
  favourites: number
  rarity?: Rarity
}

type Rarity = 'Comum' | 'Incomum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico'
```

Relacionamentos implícitos (não modelados em DB):
- `Character` → `Media[]` (via `media.nodes`): um personagem aparece em um ou mais animes/mangas.
- `Collection` → `Character[]`: coleção do usuário é uma lista de `Character` (sem duplicatas por `id`).
- `Theme` → `Palette`: cada tema tem uma paleta de cores.
- `Theme` → `arquivo`: cada tema referencia uma imagem de pack em `public/packs/`.

---

## 7. Regras de Raridade, Cartas, Personagens e Transformações

### Raridade (implementada)

Definida em `src/components/RarityBadge.tsx:35-51`.

**Atribuição por popularidade:** personagens são ordenados por `favourites` do AniList (descendente). Os top 5 recebem Mítico, posições 5–24 Lendário, 25–74 Épico, 75–174 Raro, 175–324 Incomum, 325–499 Comum.

**Chance de sair no pack:** peso acumulativo. Comum 55% é o mais provável; Mítico 0.5% é o mais raro.

**Cores e estilo por raridade:** `RARITY_COLORS` define bg, border, glow, text, primary, secondary, glowColor e gradient para cada raridade. Usado em `RarityBadge`, `CharacterCard`, `CardFront`, `SummaryScreen`, `PackSlotsPanel`, `StackPhase`.

**Efeitos visuais por raridade:** `FrameFX` adiciona partículas animadas nas bordas (exceto Comum). `RarityFrame` adiciona brilho animado (exceto Comum). `StackPhase` adiciona flash de tela e partículas extras para Épico/Lendário/Mítico. `FlipCard` adiciona flash específico para Mítico/Lendário/Épico/Raro (não integrado).

### Cartas (implementado)

- Cada carta é um `Character` da AniList com um `rarity` atribuído.
- Imagem: `character.image.large`.
- Título do anime: primeiro nó de `media.nodes` com `type === 'ANIME'`, usa `title.english` ou `title.romaji`, fallback "Desconhecido".
- Favs: exibidos com `❤ {favourites.toLocaleString()}`.
- Moldura: imagem `public/molduras/frame-{raridade}.webp` com borda arredondada (4.7%/3.1%).

### Personagens (implementado)

- Fonte: AniList GraphQL, top 500 por `FAVOURITES_DESC`, 24h de cache.
- Filtro adulto: personagens com qualquer mídia `isAdult` são removidos.

### Transformações (não implementado)

Não existe qualquer sistema de transformação, evolução, forma alternativa, awakening, ou upgrade de cartas. Uma carta obtida é sempre a mesma, sem níveis ou estágios.

---

## 8. Funcionalidades do Painel Administrativo

**Não existe painel administrativo.** Não há referências a `admin`, rotas de admin, autenticação, gerenciamento de usuários, CRUD de personagens, raridades, temas ou coleções no código-fonte. Este item está listado por exigência do escopo de documentação, mas não há nada a documentar além da ausência.

---

## 9. Bugs Conhecidos e Problemas Pendentes

### Bugs / comportamentos inesperados observados no código

1. **`App.tsx:309`** — `handleOpenPack` chama `nextTheme()` antes do sorteio, então o tema muda a cada pack aberto (mesmo que o usuário queira manter o mesmo tema). O botão "Sortear outro pack" também chama `nextTheme()`.
2. **`PackOpeningScreen.tsx:34`** — `onCancel` prop é recebido mas nunca usado (nomeado `_onCancel`). Não há efeito para cancelar a abertura além de fechar a tela manualmente.
3. **`App.tsx:315-319`** — `handlePackComplete` adiciona as cartas à coleção e abre o resumo, mas não reseta `packCards`; `handleSummaryClose` reseta. Se o usuário abrir outro pack diretamente do resumo (`handleSummaryOpenAnother`), as cartas são substituídas corretamente.
4. **`TearablePack.tsx:136`** — Limiar de arrasto para rasgar é `progress >= 0.7` (70% da largura). Um clique simples chama `start()` via `onPackClick` (apenas se não houve arrasto recente).
5. **`StackPhase.tsx:120`** — `current.media.nodes.find((m) => m.type === 'ANIME')` é chamado fora do JSX em cada render; se `current` for undefined (índice fora do range), pode lançar erro. No entanto, `isLast` impede avanço além do último.
6. **`FlipCard.tsx` e `LoadingSkeleton.tsx`** — componentes importáveis mas nunca utilizados em nenhum lugar do código (código morto).
7. **`public/verso da carta/`** e **`public/matsuri-pack.png`** — arquivos de assets presentes mas não referenciados em nenhum componente.
8. **`AppShell.tsx:23`** — "Moedas: 0" é texto estático; não há sistema de moedas.
9. **`ColecaoTab.tsx`** — placeholder "Em breve"; a coleção não pode ser visualizada em uma tela dedicada (só vista parcialmente no `PackSlotsPanel`).
10. **`App.tsx:140`** — `Object.entries(RARITY_RANGES)` itera sobre as entradas; a ordem de iteração de `Object.entries` em strings segue a ordem de inserção, que coincide com a ordem do objeto (`Mítico` primeiro, `Comum` último), então a atribuição funciona corretamente, mas depende dessa ordem.

### Problemas pendentes (backlog implícito)

- Implementar a aba Coleção (visualizar cartas obtidas, filtrar por raridade, buscar).
- Implementar sistema de moedas e uso delas (atualmente "Moedas: 0" é inerte).
- Implementar painel administrativo (se for parte do escopo).
- Implementar autenticação e sincronização de coleção (atualmente só `localStorage`).
- Remover ou integrar `FlipCard.tsx` e `LoadingSkeleton.tsx`.
- Remover ou usar assets órfãos (`verso da carta/`, `matsuri-pack.png`).
- Adicionar testes (nenhum existe).
- Considerar fallback quando o pool de uma raridade está vazio (já existe `fallbackRarities` em `drawCharacter`).

---

## 10. Testes Realizados e Resultados

**Não existem testes automatizados no projeto.** Não há pasta `__tests__`, arquivos `*.test.*`, `*.spec.*`, nem framework de teste (Vitest, Jest, Playwright, etc.) listado em `package.json` ou `devDependencies`.

Os únicos "testes" são:
- Compilação TypeScript via `tsc` (script `build` roda `tsc && vite build`).
- Verificação visual manual durante o desenvolvimento.

Resultado: sem resultados de teste documentados. Qualquer nova implementação deve incluir testes do zero.

---

## 11. Decisões Técnicas Importantes (não alterar sem necessidade)

| Decisão | Local | Justificativa |
|---------|-------|---------------|
| Proxy `/api/anilist` → AniList GraphQL | `vite.config.ts:9` | Contorna CORS da AniList e injeta `User-Agent` exigido pela API. |
| `noEmit: true`, `verbatimModuleSyntax: true` | `tsconfig.json` | Vite handle a transpilação; `tsc` apenas typecheck. |
| Tipos de personagem definidos localmente (`RarityBadge.tsx`) | `src/components/RarityBadge.tsx:26-33` | A resposta da AniList é mapeada para interfaces próprias; evita depender de tipos gerados da API. |
| Raridade baseada em ranking de `favourites` | `App.tsx:139-152` | Determinístico e reflete popularidade real do AniList. |
| Pesos de pull fixos (`RARITY_WEIGHTS`) | `RarityBadge.tsx:44-51` | Taxas fixas para Comum (55%) até Mítico (0.5%). |
| Cache de 24h em `localStorage` | `App.tsx:154-176` | Evita reconsultar a AniList a cada recarga; respeita rate limits. |
| `localStorage` como único persistence | `App.tsx:178-200`, `EffectsContext.tsx` | Sem backend; dados ficam no navegador do usuário. |
| Cartas dedupadas por `id` na coleção | `App.tsx:191-200`, `PackOpeningScreen.tsx:58-65` | Evita duplicatas da mesma personagem na coleção. |
| Molduras em `public/molduras/frame-{raridade}.webp` | `RarityFrame.tsx:45-102` | Imagens estáticas de borda por raridade; `frames.json` documenta a geometria (1024×1536). |
| 5 cartas por pack | `App.tsx:310` | Constante fixa em `drawMultiple(charactersByRarity, 5)`. |

---

## 12. Próximas Tarefas e Prioridades

### Prioridade alta

1. **Implementar a aba Coleção** (`ColecaoTab.tsx`) — exibir as cartas obtidas do `localStorage`, filtrar por raridade, mostrar contador total e por raridade.
2. **Adicionar testes automatizados** — escolher um framework (ex. Vitest + React Testing Library) e cobrir `rollRarity`, `drawCharacter`, `assignRarities`, `getHighestRarity`, e persistência da coleção.
3. **Limpar código morto** — decidir se integra ou remove `FlipCard.tsx` e `LoadingSkeleton.tsx`; remover assets órfãos (`verso da carta/`, `matsuri-pack.png`).

### Prioridade média

4. **Implementar sistema de moedas** — o cabeçalho já exibe "Moedas: 0"; definir como ganhar e gastar (ex. custo por pack, recompensas por raridade).
5. **Corrigir o comportamento de troca de tema** — `handleOpenPack` muda o tema automaticamente; avaliar se é desejável ou se o usuário deve escolher manualmente.
6. **Tratar edge case de `current` undefined em `StackPhase.tsx:120`** — guarda contra acesso a propriedade de `undefined`.

### Prioridade baixa / futuro

7. **Painel administrativo** — apenas se for parte do escopo; atualmente não existe nenhuma referência.
8. **Autenticação e sincronização de coleção** — permitir login e salvar coleção em servidor, não apenas `localStorage`.
9. **Transformações de personagens** — evolução, formas alternativas, awakening (não existe rascunho no código).
10. **Mais temas e packs** — atualmente são 10 temas estáticos.

---

## Como rodar o projeto

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção (roda tsc + vite build)
npm run build

# Preview do build
npm run preview
```

Variáveis de ambiente: nenhuma necessária. O proxy da AniList é configurado em `vite.config.ts`.

---

*Documentação gerada a partir da análise direta do código-fonte em `C:\Users\Fabricio Grando\animepull`. Nenhuma informação foi inventada; itens ausentes no código são marcados como "não implementado" ou "não existem".*
