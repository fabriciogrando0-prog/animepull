# Arquitetura do Image Collector Automático

**Projeto:** AnimePull  
**Etapa:** 1 — Arquitetura (apenas planejamento, nenhuma implementação)  
**Status:** Proposta de arquitetura. Nenhum arquivo do jogo foi alterado, nenhuma dependência instalada, nenhuma imagem baixada.

---

## 1. Resumo da investigação

### Arquivos consultados

| Arquivo | O que é | Relevância para o coletor |
|---------|---------|---------------------------|
| `src/App.tsx` | Componente raiz: carrega 500 personagens da AniList, sorteio, raridade, coleção em `localStorage` | Fonte da lista de personagens e da chave `animepull_collection` |
| `src/components/RarityBadge.tsx` | Tipos `Character`, `Rarity`, cores, pesos | Modelo de dados base a ser estendido com campos de imagem local |
| `src/components/AdminPanel.tsx` | Painel de administração (existe, não documentado no `PROJECT_CONTEXT.md`) | Ponto de entrada do coletor na interface do jogo |
| `src/components/ImageCollectorStats.tsx` | Cards de estatística (total, com imagem, sem imagem, original AniList) | Base para o dashboard de progresso do coletor |
| `src/components/CharacterGalleryAdmin.tsx` | Galeria paginada (24/página), filtros, seleção, lote de 20 | Base para a galeria de revisão e substituição manual |
| `src/components/CharacterThumbnailAdmin.tsx` | Miniatura do personagem com imagem AniList | Modelo de exibição de candidato a imagem |
| `src/components/BatchConfirmation.tsx` | Modal de confirmação de lote (limite 20) | Base para confirmação de lotes de download/substituição |
| `src/themes/CardBack.tsx` | Usa `import.meta.env.BASE_URL` + `t.verso` | Padrão de referência de imagens locais já adotado pelo jogo |
| `src/themes/types.ts` | Interface `Theme` com `verso` | Mostra convenção de nomes de arquivos locais (`verso-<id>.png`) |
| `vite.config.ts` | Proxy `/api/anilist` → AniList GraphQL com `User-Agent` | Fonte de dados já integrada e respeitosa aos termos da AniList |
| `package.json` | Stack: React 19, Vite 8, TypeScript, Tailwind 4, Framer Motion | Sem backend; build frontend-only |
| `.gitignore` | Ignora `node_modules`, `dist`, logs | Define o que NÃO vai para o GitHub |
| `docs/IMAGE_SOURCE_RESEARCH.md` | Pesquisa de fontes de imagem (AniList, Jikan/Tenrai, Wikimedia) | Recomenda manter a AniList como fonte primária |
| `CONTINUIDADE.md` | Preferências de trabalho do usuário e regras do `PROJETO.md` | Regras de commits, edições pontuais, sem dependências pesadas |
| `PROJECT_CONTEXT.md` | Documentação técnica do jogo | Arquitetura atual (SPA, `localStorage`, AniList, 10 temas) |

### Descoberta importante

Já existe um **esqueleto do Image Collector** no jogo, marcado como "Em desenvolvimento". Ele mostra estatísticas e galeria, mas **não busca, não baixa, não associa, não substitui nem recupera** imagens. A etapa 1 deve propor como completar esse esqueleto sem quebrar o que já existe.

---

## 2. Princípios e regras de arquitetura

| Regra | Como a arquitetura atende |
|-------|---------------------------|
| Busca/download separado da interface do jogo | Coletor é um **módulo Node.js local**, fora do bundle React. O jogo apenas lê arquivos locais. |
| Jogo leve, carrega apenas imagens necessárias | O jogo nunca faz pesquisa externa. Carrega apenas o caminho da imagem local já definida. |
| Nenhuma pesquisa externa durante packs/cartas | Buscas acontecem apenas no coletor, disparado pelo admin, nunca no fluxo de jogo. |
| Sem dependências pesadas sem justificativa | Coletor usa apenas `node:http`/`fetch` nativo do Node. Nenhuma biblioteca de scraping ou navegador. |
| Soluções gratuitas priorizadas | AniList (API pública gratuita) como fonte principal. |
| Sem Google Images / scraping instável | Nenhuma requisição a páginas HTML do Google. Apenas APIs públicas de personagens. |
| Imagens locais prioritárias, sem dependência de links externos | O jogo referencia imagens salvas localmente em `public/`. Links externos são fallback temporário. |
| Preservar o sistema existente | Nenhum arquivo do jogo é alterado nesta etapa. O coletor se integra por extensão, não por substituição. |

---

## 3. Arquitetura recomendada

### Visão geral

O sistema se divide em **duas camadas desacopladas**:

1. **Coletor de Imagens (módulo Node.js local)** — roda fora do jogo, apenas quando o administrador o dispara. Responsável por buscar, baixar, validar, associar, substituir e recuperar imagens.
2. **Jogo (React/Vite)** — lê apenas imagens já salvas localmente. Nunca pesquisa na internet. Nunca baixa imagens durante o funcionamento normal.

```
┌─────────────────────────────────────────────────────────────┐
│                   JOGO (React + Vite)                        │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │  Admin Panel│  │  CardFront / CharacterCard           │  │
│  │  (leitura)  │──┤  lê public/images/characters/*.webp │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ importa metadados (JSON)
┌─────────────────────────────────────────────────────────────┐
│             COLETOR (Node.js local, fora do bundle)          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │  Busca       │──┤  Downloader  │──┤  Validador     │   │
│  │  (AniList)   │  │  + selector  │  │  + match score │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Armazenamento│──┤  Batch       │──┤  Substituição  │   │
│  │ (local + JSON│  │  processador │  │  + recuperação │   │
│  │  metadados)  │  │  + progresso │  │  (backup prévio)│   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                    Fontes gratuitas (AniList primária)
```

### 3.1 Camada do coletor (Node.js)

Execute localmente, fora do processo do jogo. Pode ser invocado por um script npm ou pelo Electron (futuro).

#### A. Motor de busca
- Consulta a **AniList GraphQL** (já integrada ao jogo) por `nome do personagem + franquia`.
- Usa o campo `media.nodes` para confirmar a franquia e evitar personagens com nomes parecidos.
- Fallback opcional: Jikan/Tenrai (MAL) apenas se a AniList falhar, com aviso de instabilidade.
- **Nunca** Google Images nem scraping de HTML.

#### B. Seletor automático (melhor candidata)
Para cada personagem, o coletor recebe várias candidatas e escolhe a melhor por pontuação:
1. **Correspondência de nome** (nome completo + nativo confere com o personagem do AniList).
2. **Confirmação de franquia** (pelo menos um `media` bate com o anime do personagem).
3. **Resolução** (prioriza maior que 230 × 345 px do AniList; se não houver, aceita o tamanho da AniList).
4. **Qualidade heurística** (formato favorável, não é SVG, não é cosplay/foto detectável por heurística simples de nome/URL).
5. **Score de confiança**: abaixo de um limite, a imagem é marcada para **revisão manual**, não baixada automaticamente.

#### C. Downloader e validador
- Baixa a imagem candidata para um arquivo temporário.
- Valida: não está corrompida (é possível ler as dimensões), não é um erro 404/403, tamanho razoável.
- Converte para WebP (leve, já usado pelo jogo em `public/molduras/` e `public/packs/`).
- Salva em `public/images/characters/<id-anilist>.webp`.

#### D. Armazenamento e metadados
- **Imagens:** salvas em `public/images/characters/`. Esta pasta entra no `.gitignore` (não sobe para o GitHub), então o repositório não incha. Cada usuário gera suas próprias imagens localmente via coletor.
- **Metadados:** salvos em `public/images/metadata.json` (pequeno arquivo de texto, **sim**, commitado no GitHub). Registra para cada personagem:
  - `id` (AniList)
  - `nome`, `franquia`
  - `caminhoLocal` (ex: `images/characters/40.webp`)
  - `fonte` (AniList, Jikan, manual)
  - `resolucao`, `status` (ok, baixa_confianca, quebrada, substituida)
  - `imagemAnterior` (caminho da imagem antes da substituição, para recuperação)
  - `atualizadoEm` (timestamp)

#### E. Processamento em lotes
- Fila de personagens a processar, com **progresso persistido** em JSON (permite retomar após interrupção).
- **Rate limiting**: respeita o limite da AniList (~30 req/min), com atraso entre requisições e retry em 429.
- **Concordância controlada**: processamento sequencial ou com pouca concorrência (ex: 1 por vez) para não travar o computador nem a API.
- **Checkpoint a cada N personagens** (ex: 50), gravando progresso no disco.
- Relatório final: quantos processados, quantos com sucesso, quantos falharam, quantos precisam de revisão manual.

#### G. Detecção de imagem quebrada, substituição e recuperação
- **Quebrada:** o validador falha ao ler a imagem local (arquivo ausente, corrompido, dimensões inválidas).
- **Substituição:** o coletor busca uma nova candidata para aquele personagem e substitui o arquivo local.
- **Recuperação:** antes de sobrescrever, a imagem anterior é renomeada para `public/images/characters/backup/<id>_<timestamp>.webp` e registrada em `imagemAnterior`. O administrador pode restaurar a anterior a qualquer momento.
- **Substituição manual:** o administrador escolhe uma imagem candidata alternativa na galeria e confirma a troca.

---

### 3.2 Camada do jogo (React/Vite)

Não muda o comportamento atual. Apenas **ler** imagens locais.

#### Modelo de dados estendido (apenas leitura no jogo)

O tipo `Character` em `RarityBadge.tsx` recebe campos opcionais (não obrigatórios, para não quebrar o existente):

```ts
interface CharacterImageLocal {
  localPath?: string      // ex: "images/characters/40.webp"
  source?: string         // "anilist" | "jikan" | "manual"
  status?: string         // "ok" | "broken" | "pending"
}
```

`image.large` continua sendo a URL da AniList (fallback). Se `localPath` existir e o arquivo estiver disponível, o jogo exibe a local; caso contrário, cai na URL da AniList.

#### Renderização
- `CardFront.tsx` e `CharacterThumbnailAdmin.tsx` tentam primeiro `import.meta.env.BASE_URL + localPath`.
- Se a imagem local falhar (`onError`), usam `character.image.large` (AniList).
- Isso mantém o jogo funcional mesmo sem rodar o coletor.

#### Admin panel (extensão do existente)
- Botão "Executar coletor" que dispara o script Node (ou abre uma tela de progresso no futuro Electron).
- Visualização do `metadata.json`: total, com imagem local, sem imagem, quebradas, pendentes de revisão.
- Revisão manual de candidatas com baixa confiança.
- Confirmação de substituição e restauração de imagem anterior.

---

### 3.3 Por que um módulo Node.js separado (e não dentro do jogo)

| Motivo | Explicação |
|--------|------------|
| Jogo leve | Nenhum código de busca/download entra no bundle React. |
| Sem rede durante o jogo | O coletor só roda quando o admin o dispara; packs/cartas nunca pesquisam na internet. |
| Electron futuro | Um módulo Node roda tanto no navegador (via script separado) quanto no processo principal do Electron, sem reescrita. |
| Sem dependências pesadas | Node tem `fetch` nativo; não precisa de puppeteer, cheerio, axios, etc. |
| Testável independentemente | O coletor pode ser testado sem iniciar o jogo. |

---

### 3.4 Armazenamento sem inflar o GitHub

- **Imagens:** `public/images/characters/` adicionado ao `.gitignore`. Não versionadas. Cada usuário baixa as suas via coletor.
- **Metadados:** `public/images/metadata.json` versionado (texto leve, poucos KB para 500 personagens).
- **Backup de substituições:** `public/images/characters/backup/` também ignorado pelo git.
- O repositório permanece pequeno; só o catálogo de mapeamento (texto) viaja no Git.

---

### 3.5 Fontes gratuitas recomendadas (por prioridade)

| Fonte | Status | Por que |
|-------|--------|---------|
| **AniList GraphQL** | ✅ Primária | Já integrada, gratuita, sem chave, permite busca por nome + franquia, arte oficial, termos permitem uso/storage. |
| **Jikan / Tenrai (MAL)** | ⚠️ Fallback | Gratuito, mas instável (jikan esteve inacessível nos testes) e é scraper não oficial. Usar apenas se AniList falhar. |
| Wikimedia Commons | ❌ Não recomendada | Retorna cosplay/SVG, não arte oficial, risco de confusão, licenças variadas com atribuição. |
| Google Images | ❌ Proibido | Scraping instável e viola termos. |
| Outras (Waifu.im, trace.moe, etc.) | ❌ Descartadas | Não buscam personagem específico por nome + franquia. |

---

### 3.6 Como evitar baixar a imagem do personagem errado

1. Buscar por `nome completo + franquia` (título do anime do `media.nodes[0]`).
2. Exigir que pelo menos um mídia devolvida tenha `type === 'ANIME'` e título compatível com a franquia do personagem.
3. Pontuar a correspondência do nome (exato > nativo > parcial).
4. Se o score de confiança estiver abaixo do limite, **não baixar automaticamente**: marcar para revisão manual do administrador.
5. Exibir no admin o nome da franquia detectada ao lado da candidata, para confirmação visual.

---

### 3.7 Estratégia para migração ao Electron (sem refazer o coletor)

- O coletor já é um módulo Node.js independente do bundle React.
- No Electron, o coletor roda no **processo principal** (ou como script local separado), com acesso direto ao sistema de arquivos.
- O jogo (renderer) continua lendo imagens via `import.meta.env.BASE_URL` (padrão já usado em `CardBack.tsx` e `RarityFrame.tsx`).
- Nenhuma reescrita do coletor é necessária: apenas expor o script como comando do Electron ou mantê-lo como CLI local.
- As imagens já estão em `public/`, acessíveis tanto no navegador quanto no Electron.

---

## 4. Vantagens e limitações

### Vantagens
- Jogo permanece leve e sem pesquisa externa durante o uso.
- Nenhuma dependência pesada nova (só Node nativo).
- Fontes gratuitas e respeitando termos (AniList).
- Imagens locais: não depende de links externos que podem quebrar.
- Registro de imagem anterior permite recuperação de substituições ruins.
- Processamento em lotes com progresso e retomada, adequado a milhares de personagens.
- Compatível com futura migração ao Electron sem refazer o coletor.
- Repositório Git não incha (imagens ignoradas, apenas metadados texto).

### Limitações
- O usuário precisa rodar o coletor localmente para ter imagens em alta resolução; sem ele, o jogo continua usando a AniList (230 × 345 px).
- Nenhuma fonte gratuita investigada supera claramente a resolução da AniList (230 × 345 px) com busca automatizada e termos claros (conforme `docs/IMAGE_SOURCE_RESEARCH.md`).
- A qualidade da substituição depende da precisão da busca por nome + franquia; personagens com nomes genéricos precisam de revisão manual.
- O primeiro uso exige execução manual do coletor (não é automático ao abrir o jogo).
- Sem backend, não há sincronização de imagens entre dispositivos (cada usuário gera localmente).

---

## 5. Ordem de implementação (etapas pequenas)

Cada etapa deve ser testada e commitada individualmente, sem alterar o funcionamento do jogo.

### Etapa 1 — Modelo de dados e metadados
- Definir o schema de `metadata.json` (id, nome, franquia, caminhoLocal, fonte, resolucao, status, imagemAnterior, atualizadoEm).
- Criar utilitário de leitura/gravação de metadados (try/catch, sem quebrar o jogo).

### Etapa 2 — Motor de busca (AniList)
- Script Node que consulta a AniList por nome + franquia usando a mesma query GraphQL do jogo.
- Retornar lista de candidatas com resolução e URL.
- Nenhuma imagem baixada ainda.

### Etapa 3 — Validador e seletor automático
- Validar que a URL da candidata é uma imagem real (ler cabeçalho/dimensões).
- Implementar score de confiança (nome, franquia, resolução).
- Marcar abaixo do limite para revisão manual.

### Etapa 4 — Downloader e armazenamento local
- Baixar imagem selecionada, converter para WebP, salvar em `public/images/characters/<id>.webp`.
- Registrar em `metadata.json`.
- Adicionar `public/images/` ao `.gitignore`.

### Etapa 5 — Integração de leitura no jogo
- Estender o tipo `Character` com campos opcionais de imagem local.
- `CardFront` e `CharacterThumbnailAdmin` tentam imagem local primeiro, com fallback para `image.large` e `onError`.
- Nenhuma busca de rede no jogo.

### Etapa 6 — Processamento em lotes com progresso
- Fila de personagens, checkpoint persistido, rate limiting, retry em 429.
- Relatório de sucesso/falha/revisão manual.

### Etapa 7 — Detecção de quebrada, substituição e recuperação
- Detectar imagens locais ausentes/corrompidas.
- Buscar substituição automática para quebradas.
- Backup da imagem anterior antes de sobrescrever; opção de restaurar.
- Substituição manual via admin.

### Etapa 8 — Admin panel completo
- Botão para disparar o coletor.
- Tela de progresso do lote.
- Galeria de revisão de candidatas de baixa confiança.
- Dashboard de estatísticas (estender `ImageCollectorStats`).

### Etapa 9 — Empacotamento para Electron (futuro)
- Expor o coletor como comando do processo principal do Electron.
- Manter o renderer lendo apenas arquivos locais via `import.meta.env.BASE_URL`.

---

## 6. Tecnologias necessárias (sem novas dependências pesadas)

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Coletor | Node.js (nativo, já instalado no ambiente do usuário) | `fetch` e `fs` nativos; nenhuma instalação de pacote |
| Busca | AniList GraphQL (via HTTP) | Já integrada ao jogo via proxy; gratuita e estável |
| Imagens | WebP (formato já usado em `public/molduras/` e `public/packs/`) | Leve, boa qualidade, compatível com o jogo |
| Metadados | JSON (`metadata.json`) | Texto leve, versionável no Git, sem inflar o repositório |
| Jogo | React + Vite (existente) | Nenhuma mudança de stack; apenas leitura de arquivos locais |

---

## 7. Conclusão

A arquitetura recomendada separa completamente o coletor do jogo: um **módulo Node.js local** cuida de buscar, baixar, validar, associar, substituir e recuperar imagens, enquanto o jogo apenas **lê arquivos locais** já definidos. Isso respeita todas as regras (jogo leve, sem rede durante packs/cartas, sem dependências pesadas, fontes gratuitas, sem Google Images, imagens locais prioritárias, preservação do sistema existente) e prepara o terreno para a futura migração ao Electron sem refazer o coletor. A implementação deve seguir as 9 etapas acima, cada uma testada e commitada individualmente, começando pelo modelo de metadados e terminando com o painel administrativo completo.
