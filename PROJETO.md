# AnimePull - PROJETO.md

## Visão geral

Jogo de abrir packs de cards de personagens de anime (gacha-style). O usuário abre packs com 5 cartas aleatórias, cada uma com raridade baseada no ranking de favoritos da AniList, e as cartas obtidas vão para a coleção local.

## Stack

- React 19 + Vite + TypeScript + Tailwind CSS 4 + framer-motion
- API pública da AniList (GraphQL): 500 personagens mais favoritados, cache de 24h em `localStorage`
- Progresso salvo em `localStorage` (`animepull_collection`, cache de personagens, efeitos)
- Futuro: programa de desktop (Electron). Imagens em `public/`, acessadas via `import.meta.env.BASE_URL`

## Telas/Abas

- Packs — abrir packs, trocar de tema
- Coleção — placeholder ("Em breve")
- Ranking — tabela de raridades, estatísticas do pool, top 50 personagens

## Raridades (fixas, nunca mudam com o tema)

| Raridade | Cor | Chance | Posição no ranking (favoritos desc) |
|---|---|---|---|
| Comum | #9ca3af | 55% | 325–499 |
| Incomum | #22c55e | 25% | 175–324 |
| Raro | #3b82f6 | 12% | 75–174 |
| Épico | #a855f7 | 5% | 25–74 |
| Lendário | #fbbf24 | 2,5% | 5–24 |
| Mítico | #f43f5e | 0,5% | 0–4 |

A raridade vem da posição no ranking de favoritos. Pesos de pull fixos (`RARITY_WEIGHTS`) em `src/components/RarityBadge.tsx`.

## Regras fixas

- Faça só o que foi pedido, com edições pontuais. Nunca reescreva um arquivo inteiro sem ser pedido.
- Componentes novos em arquivos próprios, de no máximo ~200 linhas.
- Não altere sorteio, API, lógica da abertura nem temas, a menos que o pedido diga.
- Centralize com flexbox, nunca com absolute + transform.
- Anime só transform e opacity.
- Sem dados falsos (mock). localStorage sempre com try/catch.
- Imagens em `public/`, via `import.meta.env.BASE_URL`.
- Arte desenhada só em SVG/CSS, sem imagem nem fonte externa.
- Nenhum ancestral com `overflow hidden` cortando efeitos que vazam para fora da carta.
- Antes de editar uma tela, diga qual arquivo e qual linha a renderiza, mostrando o trecho.
- Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e explique o problema.

## Como rodar

```bash
npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento
npm run build      # tsc + vite build (produção)
npm run preview    # preview do build
```

Sem variáveis de ambiente necessárias. O proxy da AniList está configurado em `vite.config.ts` (`/api/anilist` → `https://graphql.anilist.co`).
