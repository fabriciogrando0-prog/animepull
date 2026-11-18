# Pesquisa de fontes alternativas de imagens — Image Collector

**Projeto:** AnimePull  
**Etapa:** 4 — Investigação de fontes alternativas de imagens para o Image Collector  
**Autor:** Kilo (agente de engenharia de software)  
**Data:** 2026-11-18  
**Status:** Apenas pesquisa/documentação. Nenhum arquivo do projeto foi alterado, nenhuma integração foi implementada, nenhuma imagem foi baixada para `public/` e nenhuma imagem existente foi substituída.

---

## 1. Objetivo

Descobrir fontes que permitam encontrar automaticamente imagens de personagens de anime em **resolução superior à da AniList (230 × 345 px)** para uso no coletor de imagens do AnimePull.

## 2. Personagens usados no teste

| # | Personagem | Franquia |
|---|---|---|
| 1 | Monkey D. Luffy | One Piece |
| 2 | Naruto Uzumaki | Naruto |
| 3 | Son Goku | Dragon Ball |
| 4 | Levi Ackerman | Attack on Titan |
| 5 | Satoru Gojo | Jujutsu Kaisen |

## 3. Fontes investigadas

### 3.1 AniList (baseline, já integrada ao projeto)

API pública GraphQL (`https://graphql.anilist.co`), já consumida via proxy do Vite (`/api/anilist`).

- **Busca por nome + franquia:** sim (`Character(search:)` + relação `media`).
- **Resolução real medida:** `230 × 345 px` (campo `image.large`) para todos os 5 personagens.
- **Gratuidade e limites:** gratuito, sem chave para dados públicos. Limite ~30 req/min (o header `x-ratelimit-limit` reporta 30; docs falam em 90). HTTP 429 com `Retry-After` ao exceder.
- **Uso e armazenamento:** permitido pela API pública para uso nos termos do AniList. Imagens servidas pelo CDN `s4.anilist.co`.
- **Risco de confusão por nomes semelhantes:** baixo. A busca devolve o personagem exato e a relação `media` confirma a franquia (ONE PIECE, Naruto, Dragon Ball, etc.).

**Resultado do teste prático (AniList):**

| Personagem | ID AniList | Nome devolvido | Resolução | Imagem | Página de origem |
|---|---|---|---|---|---|
| Monkey D. Luffy | 40 | Luffy Monkey | 230 × 345 | `https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png` | https://anilist.co/character/40 |
| Naruto Uzumaki | 17 | Naruto Uzumaki | 230 × 345 | `https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png` | https://anilist.co/character/17 |
| Son Goku | 246 | Gokuu Son | 230 × 345 | `https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png` | https://anilist.co/character/246 |
| Levi Ackerman | 45627 | Levi | 230 × 345 | `https://s4.anilist.co/file/anilistcdn/character/large/b45627-CR68RyZmddGG.png` | https://anilist.co/character/45627 |
| Satoru Gojo | 127691 | Satoru Gojou | 230 × 345 | `https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png` | https://anilist.co/character/127691 |

> Nota: a busca `"Levi Ackerman"` retornou 404 transitório (limite de taxa); a busca `"Levi"` localizou o personagem correto (ID 45627, mesmo `mal_id` do MAL).

### 3.2 Jikan (API não oficial do MyAnimeList) — `api.jikan.moe/v4`

- **Busca por nome + franquia:** sim (`GET /characters?q=`, devolve `anime[]` do personagem).
- **Resolução real medida:** `225 × 350 px` (imagem principal do personagem), exceto Son Goku `199 × 347 px`.
- **Gratuidade e limites:** gratuito, sem chave. 3 req/s e 60 req/min por IP; ilimitado por dia. Pode ser rate-limited pelo próprio MyAnimeList.net.
- **Uso e armazenamento:** API não oficial que faz *scraping* do MAL; não é afiliada ao MAL. Imagens hospedadas em `cdn.myanimelist.net`. Não há garantia de direitos sobre as imagens.
- **Risco de confusão por nomes semelhantes:** baixo (devolve `mal_id` e lista de animes do personagem).
- **Observação crítica:** durante os testes `api.jikan.moe` esteve **inacessível** (erro sem resposta para todos os 5 personagens). Não é uma fonte estável no momento.

Tenrai (`api.tenrai.org/v1`) é uma alternativa compatível com o esquema Jikan v4 e esteve acessível; confirmou os mesmos dados e resoluções do MAL (abaixo), mas está em beta.

**Resultado do teste prático (Tenrai/Jikan — MAL):**

| Personagem | MAL ID | Nome devolvido | Resolução | Imagem | Página de origem |
|---|---|---|---|---|---|
| Monkey D. Luffy | 40 | Monkey D., Luffy | 225 × 350 | `https://cdn.myanimelist.net/images/characters/9/310307.jpg` | https://myanimelist.net/character/40/Luffy_Monkey_D_ |
| Naruto Uzumaki | 17 | Uzumaki, Naruto | 225 × 350 | `https://cdn.myanimelist.net/images/characters/2/284121.jpg` | https://myanimelist.net/character/17/Naruto_Uzumaki |
| Son Goku | 12498 | Son-Goku | 199 × 347 | `https://cdn.myanimelist.net/images/characters/15/72193.jpg` | https://myanimelist.net/character/12498/Son-Goku |
| Levi Ackerman | 45627 | Levi | 225 × 350 | `https://cdn.myanimelist.net/images/characters/2/241413.jpg` | https://myanimelist.net/character/45627/Levi |
| Satoru Gojo | 164471 | Gojou, Satoru | 225 × 350 | `https://cdn.myanimelist.net/images/characters/15/422168.jpg` | https://myanimelist.net/character/164471/Satoru_Gojou |

### 3.3 Wikimedia Commons

API MediaWiki (`https://commons.wikimedia.org/w/api.php`), busca em `srnamespace=6` (arquivos).

- **Busca por nome + franquia:** limitada. Não há busca estruturada por personagem+franquia; retorna o que a busca full-text encontrar.
- **Resolução real:** variável, depende do arquivo encontrado.
- **Gratuidade e limites:** gratuito, imagens com licenças livres (CC BY, CC0, PD etc.). Não há cota publicada pública; reuso exige respetar a licença de cada arquivo.
- **Uso e armazenamento:** permitido somente segundo a licença de cada arquivo (geralmente com atribuição). Nem todos permitem uso comercial/armazenamento sem crédito.
- **Risco de confusão por nomes semelhantes:** alto. A busca não distingue personagem de cosplay, artes de fã, estatísticas em SVG etc.

**Resultado do teste prático (Commons):** a busca devolveu, para os 5 personagens, principalmente **fotos de cosplay**, arquivos SVG de estatísticas ("Stats.svg") e arquivos não relacionados (ex.: "Self-portrait in a Straw Hat", "GEAR 5 LUFFY EN CDMX", "Cosplay of Monkey D. Luffy"). **Não devolveu arte oficial de personagem** adequada para cartas de jogo. Não é uma fonte viável para esse uso.

### 3.4 Outras fontes consideradas e descartadas

| Fonte | Motivo do descarte |
|---|---|
| Waifu.im / Nekosia / nekos.best | Imagens aleatórias por tag; não permitem buscar um personagem específico por nome + franquia. |
| trace.moe | Busca reversa por imagem (frame de anime), não busca de personagem por nome. |
| MyAnimeList oficial | Exige registro e `client_id` (OAuth); não é gratuito/anônimo. |
| AnimeNewsNetwork | Enciclopédia em XML, limite 1 req/s, focado em dados, não em imagens de personagens. |
| AniDB | Exige registro; política rígida com ban por abuso; voltado a especialistas. |
| Shikimori | Exige `client_id` de aplicação. |
| MangaDex | Focado em mangá, não em imagens de personagens de anime. |
| Danbooru / Konachan / Yandere | Boorus de imagem; risco de conteúdo NSFW e questões de *scraping*/licença. Não adequado a um jogo público. |

## 4. Tabela comparativa final

| Critério | AniList (baseline) | Jikan / Tenrai (MAL) | Wikimedia Commons |
|---|---|---|---|
| Busca por nome + franquia | ✅ Sim | ✅ Sim | ❌ Limitada/estrutural |
| Resolução medida | **230 × 345** | 225 × 350 (Goku 199 × 347) | Variável (não oficial) |
| Supera a AniList? | — | ❌ Não (igual/inferior) | ❌ Não confirmado |
| Gratuito, sem chave | ✅ Sim | ✅ Sim | ✅ Sim |
| Limite de uso | ~30 req/min | 3 req/s / 60 req/min | Sem cota pública clara |
| Estabilidade / disponibilidade | ✅ Alta (já integrada) | ❌ Baixa (`api.jikan.moe` inacessível nos testes; Tenrai em beta) | ✅ Alta |
| Permite uso + armazenamento | ✅ (termo da API pública) | ⚠️ API não oficial, sem garantia de direitos | ⚠️ Depende da licença de cada arquivo (atribuição) |
| Risco de confusão (nomes semelhantes) | ❌ Baixo | ❌ Baixo | ✅ Alto |
| Automação viável | ✅ Sim (GraphQL, já integrado) | ⚠️ Sim, mas instável | ⚠️ Sim, mas resultados inadequados |
| Adequação ao AnimePull | ✅ Recomendada | ❌ Não recomendada | ❌ Não recomendada |

## 5. Recomendação

**Manter a AniList como fonte de imagens.**

Nenhuma fonte alternativa investigada oferece resolução claramente superior à AniList (230 × 345 px) ao mesmo tempo em que é gratuita, estável, permite busca por personagem + franquia e autoriza uso/armazenamento sem fricção:

- **Jikan/Tenrai (MAL):** localiza todos os 5 personagens, mas as imagens são `225 × 350` (ou `199 × 347` para Goku) — não superiores à AniList — e o endpoint principal `api.jikan.moe` esteve inacessível durante os testes. É um *scraper* não oficial do MAL, sem garantia de direitos sobre as imagens.
- **Wikimedia Commons:** não devolve arte oficial de personagem; resultados são cosplay, SVGs e arquivos não relacionados, com licenças variadas e obrigação de atribuição.
- **Demais APIs:** não suportam busca de personagem específico por nome+franquia ou exigem registro/pagamento.

Portanto, o objetivo de "imagens em resolução superior à AniList" **não foi atingido por nenhuma fonte gratuita e automatizável investigada**. A AniList continua sendo a melhor opção em qualidade (arte oficial), precisão (personagem + franquia), gratuidade, estabilidade e possibilidade de automação, e já está integrada ao projeto via proxy `/api/anilist`.

Se futuramente for estritamente necessário ter resolução acima de 230 × 345 px, os caminhos viáveis seriam: (a) negociar uso de arte oficial licenciada com os detentores de direitos (não gratuito/não automatizado), ou (b) manter a AniList e avaliar, apenas então, integrações pagas — sempre deixando o caráter pago explícito, conforme restrições do projeto. Nenhuma integração deve ser implementada nesta etapa.

---

## 6. Como os testes foram realizados

- Requisições HTTP diretas (PowerShell `Invoke-WebRequest`) aos endpoints públicos das APIs, sem *scraping* de sites HTML, sem navegadores automatizados e sem FFmpeg.
- Nenhuma imagem foi baixada para `public/`; as dimensões foram obtidas lendo os cabeçalhos/binários em memória durante a verificação, sem gravar no repositório.
- Nenhum arquivo do projeto foi modificado.
