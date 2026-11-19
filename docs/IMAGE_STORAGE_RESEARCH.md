# Pesquisa: Fontes de Imagens e Armazenamento Local — AnimePull

**Projeto:** AnimePull  
**Etapa:** 2 — Fontes de imagens e armazenamento local (apenas planejamento/pesquisa)  
**Status:** Relatório de pesquisa. Nenhum arquivo do jogo alterado, nenhuma dependência instalada, nenhuma imagem baixada, nenhuma funcionalidade implementada.  
**Base:** `docs/IMAGE_COLLECTOR_ARCHITECTURE.md` (Etapa 1) e pesquisas de fontes públicas (Out/Nov 2026).

---

## 1. Fontes de imagens investigadas

Foram pesquisadas APIs gratuitas e mecanismos de busca que permitam encontrar imagens de personagens de anime por **nome do personagem + franquia**, com resolução superior ao `medium` da AniList (~230 × 345 px), idealmente 600 px, 800 px ou mais, sem scraping que viole termos de serviço.

| Fonte | Tipo | Custo | Chave | Limite de taxa | Busca nome + franquia | Resolução típica | Termos / uso | Veredito |
|-------|------|-------|-------|----------------|----------------------|------------------|--------------|----------|
| **AniList GraphQL** | API oficial de personagens | Grátis | Não | ~90 req/min (docs); ~30 req/min em degradação observado | Sim (search por nome + `media.nodes` para franquia) | `medium` ~230×345 px; `large` = maior disponível, variável, frequentemente acima do medium sem garantia de 600–800 px | Permite uso/storage de dados públicos; já integrada ao jogo via proxy | ✅ **Primária** |
| **Jikan (MAL não oficial)** | REST sobre MyAnimeList | Grátis | Não | 3 req/s e 60 req/min por IP; cache 24h | Sim (`/characters`, `/characters/{id}/pictures`) | Imagens do MAL, variável, geralmente menor que alvo | Não oficial; scraping do MAL; instável (fora do ar em testes Out/Nov 2026) | ⚠️ **Fallback apenas** |
| **Kitsu** | JSON:API anime/manga | Grátis | Não (OAuth só para listas) | Não publicado; página max 20 | Sim por título, limitado | Capas/posters de anime, não focado em personagem | Confiável, mas pouco coverage de imagem de personagem | ❌ Não indicada |
| **Waifu.im** | Arquivo de ilustrações anime | Grátis | Não para uso normal | Não publicado | Não (busca por tags, não personagem + franquia) | Alta, filtrável por resolução | >4.000 imagens curadas; não cobre personagens específicos por nome | ❌ Não indicada |
| **trace.moe** | Busca reversa por frame/screenshot | Grátis | Opcional (patrocínio) | 100 buscas/dia, 1 por vez | Não (busca por imagem, não por nome) | Frames de anime | Identifica cena a partir de screenshot | ❌ Não indicada |
| **Wikimedia Commons** | Repositório de mídia | Grátis | Não | N/A | Sim, mas impreciso | Variável, muito SVG/cosplay | Licenças variadas com obrigação de atribuição; risco de confusão de personagem | ❌ Não recomendada |
| **Google Images** | Mecanismo de busca | — | — | — | Sim | Alta | Scraping instável e viola termos de serviço | ❌ **Proibido** |

### Descobertas importantes sobre fontes

- **Nenhuma fonte gratuita investigada garante claramente 600–800 px com busca automatizada por nome + franquia e termos claros.** O `image.large` da AniList é o maior tamanho que ela expõe por personagem; costuma ser maior que o `medium` (230 × 345 px), mas não há garantia de ultrapassar 600 px. A taxa de acerto é alta para personagens populares (muitos favourites, imagens oficiais) e menor para personagens obscuros ou nomes genéricos.
- **Jikan** expõe `/characters/{id}/pictures`, útil como fallback, mas o serviço público esteve inacessível em testes recentes (out/nov 2026) e depende do scraping do MyAnimeList, o que o torna instável. Limite: 3 req/s, 60 req/min.
- **AniList** permanece a fonte mais confiável: sem chave, CORS, GraphQL permite buscar personagem por nome e confirmar franquia via `media.nodes` (evita personagens com nomes parecidos), taxa de ~90 req/min, já integrada ao jogo. Taxa de acerto alta para personagens conhecidos; moderada para menos populares.

### Recomendação de fontes (prioridade)

1. **AniList GraphQL** — primária. Busca `nome + franquia`, usa `image.large` como candidata automática.
2. **Jikan** — fallback apenas se AniList falhar, com aviso de instabilidade e rate limit conservador.
3. **Revisão manual** — quando a resolução do candidato automático for insuficiente (< 600 px) ou o score de confiança estiver baixo, o administrador escolhe uma alternativa na galeria.

Nunca usar Google Images nem scraping de HTML.

---

## 2. Estratégia de armazenamento local

### Organização de pastas

Imagens salvas dentro do projeto, fora do bundle do jogo:

```
animepull/
  public/
    images/
      characters/
        40.webp
        123.webp
        ...
      backup/
        40_20261119T173000.webp   (imagem anterior antes de substituição)
      metadata.json               (mapeamento id → caminho, texto leve)
```

- A pasta `public/images/` entra no `.gitignore` (imagens não versionadas, não sobem para o GitHub).
- `metadata.json` é versionado (texto leve; mapeamento de IDs para caminhos).

### Formato recomendado: WebP

- **WebP** é o formato recomendado. Já é usado no projeto em `public/molduras/` e `public/packs/` (conforme `IMAGE_COLLECTOR_ARCHITECTURE.md`), leve, boa qualidade, compatível com navegadores modernos e Vite.
- Alternativa de fallback: JPEG, se alguma ferramenta local não suportar WebP. PNG evitado (arquivos muito maiores para ilustrações).

### Qualidade e tamanho dos arquivos

- Redimensionar para **no máximo 800 px no lado maior**, mantendo proporção (evita imagens desnecessariamente grandes; 600–800 px já é superior aos 230 × 345 px da AniList).
- Qualidade WebP **80–85**.
- Tamanho estimado por imagem: **40–100 KB** (média ~75 KB), podendo variar de 30 KB a 150 KB dependendo da ilustração.

### Nomes de arquivos e associação com IDs

- Nome do arquivo: **`<id-anilist>.webp`** (ex: `40.webp`). O ID da AniList é único, estável e já usado pelo jogo.
- Associação feita em `public/images/metadata.json`, registrando por personagem:
  - `id` (AniList)
  - `nome`, `franquia`
  - `caminhoLocal` (ex: `images/characters/40.webp`)
  - `fonte` (`anilist`, `jikan`, `manual`)
  - `resolucao` (largura × altura)
  - `status` (`ok`, `baixa_confianca`, `quebrada`, `substituida`)
  - `imagemAnterior` (caminho da imagem antes da substituição, para recuperação)
  - `atualizadoEm` (timestamp)

### Facilidade para substituir imagens

- Antes de sobrescrever, a imagem anterior é movida para `public/images/backup/<id>_<timestamp>.webp` e registrada em `imagemAnterior`.
- O administrador pode restaurar a anterior a qualquer momento.
- Substituição manual via admin: escolhe candidata alternativa na galeria e confirma a troca.

### Backup e recuperação de imagens antigas

- Backup local: copiar a pasta `public/images/characters/` (e `backup/`) para outro disco ou nuvem pessoal.
- Recuperação: se as imagens forem perdidas, `metadata.json` (versionado no Git) mantém o mapeamento; o coletor pode ser reexecutado para rebaixar as imagens localmente.
- Imagens quebradas: detectadas pelo validador (arquivo ausente/corrompido/dimensões inválidas); o coletor busca substituição automática para aquelas personagens.

### Escalabilidade (1.000, 5.000, 10.000 imagens)

- Estrutura **flat** (`characters/<id>.webp`) é suficiente para até 10.000 arquivos em sistemas de arquivos modernos (NTFS/SSD); testes mostram que operações de arquivo único permanecem rápidas mesmo com centenas de milhares de arquivos, embora listagens de diretório fiquem lentas com dezenas de milhares.
- Para além de 10.000, adotar **sharding simples** (ex: `public/images/characters/4/40.webp`, dois níveis a partir de dígitos do ID) para manter poucas centenas de arquivos por pasta e facilitar backups.
- O jogo carrega **apenas as imagens necessárias** (uma por carta/pack em exibição), nunca o catálogo inteiro, mantendo-se leve independentemente do tamanho do catálogo local.
- O coletor processa em lotes com checkpoint persistido e rate limiting (respeita ~30–90 req/min da AniList), adequado a milhares de personagens.

---

## 3. Estimativa de armazenamento para 10.000 imagens

Cenários com WebP no lado máximo de 800 px, qualidade 80–85:

| Imagens | Tamanho médio por imagem | Total estimado |
|---------|-------------------------|----------------|
| 1.000 | 75 KB | ~75 MB |
| 5.000 | 75 KB | ~375 MB |
| 10.000 | 75 KB | ~750 MB |
| 10.000 | 150 KB (pior caso) | ~1,5 GB |
| 10.000 | 200 KB (margem de segurança) | ~2 GB |

`metadata.json` para 10.000 personagens: poucos MB (texto).

### 10 GB são suficientes?

**Sim, com folga.** Para 10.000 imagens o consumo estimado fica entre **0,75 GB e 2 GB** mesmo em cenários conservadores. Dez GB comportariam cerca de **50.000–100.000 imagens** na mesma estimativa, muito além do catálogo inicial (500 personagens) e de uma expansão para 10.000.

---

## 4. GitHub — manter imagens fora do repositório

### Como evitar inflar o repositório

- Adicionar `public/images/` ao `.gitignore` (já ignora `node_modules`, `dist`, logs). Imagens e pastas de backup não são versionadas.
- Apenas `public/images/metadata.json` (texto leve) é commitado no Git: é o catálogo de mapeamento `id → caminhoLocal`, que ocupa poucos KB a poucos MB.
- Cada usuário/desenvolvedor gera suas próprias imagens localmente executando o coletor (módulo Node.js fora do jogo). O repositório permanece pequeno.

### Como o jogo funciona sem as imagens no Git

- O jogo referencia a imagem local primeiro (`public/images/characters/<id>.webp`); se não existir ou falhar (`onError`), cai na URL `image.large` da AniList. Assim o jogo está funcional mesmo sem rodar o coletor.

### Disponibilizar para outros jogadores no futuro (sem hospedagem externa agora)

- **Agora:** cada jogador roda o coletor localmente para baixar suas imagens. Não há hospedagem externa e não há dependência de links externos para as cartas.
- **Futuro (opcional):** disponibilizar um "pacote de assets" (zip com `public/images/`) como download opcional separado do código, ou permitir que o coletor seja rodado em um processo principal (Electron). Isso não é hospedagem de imagens vinculada ao jogo em tempo de execução; é distribuição opcional de arquivos. Não implementar agora.

---

## 5. Recomendação simples e objetiva

1. **Fonte:** use a **AniList GraphQL** como primária (`image.large`, busca por nome + franquia), **Jikan** como fallback instável, e **revisão manual** quando a resolução/confiança for insuficiente. Não use Google Images nem scraping.
2. **Formato:** **WebP**, lado máximo **800 px**, qualidade **80–85**.
3. **Localização:** `public/images/characters/<id-anilist>.webp`, com mapeamento em `public/images/metadata.json`.
4. **Substituição/backup:** mova a imagem anterior para `public/images/backup/` antes de sobrescrever; registre `imagemAnterior` no metadata.
5. **GitHub:** ignore `public/images/` no `.gitignore`; commite apenas `metadata.json`. Cada usuário gera suas imagens localmente com o coletor.
6. **Espaço:** 10.000 imagens ocupam cerca de **0,75–2 GB**; **10 GB são suficientes** com grande folga.
