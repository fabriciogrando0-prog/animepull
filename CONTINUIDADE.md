# AnimePull - Documento de continuidade

Estado em 18/11/2026. Este documento reúne o que foi combinado, descoberto e decidido numa longa conversa, para ser colado ou anexado em um chat novo (com o Claude ou outra IA) e continuar de onde parou.

**Onde guardar:** na raiz da pasta do projeto, ao lado do `PROJETO.md` (nunca dentro de `public/` nem de `src/`, que fazem parte do jogo). Não é para o Kilo ler (é longo e tem prompts dentro); o Kilo lê o `PROJETO.md`. O arquivo cita o caminho da pasta do usuário no Windows e o repositório; o repositório é público.

**Fontes de verdade:** em caso de divergência, valem o código atual do projeto, o `PROJECT_CONTEXT.md` e o `PROJETO.md`. Este documento é um resumo e pode estar desatualizado nos detalhes de código.

---

## 1. Como a IA deve trabalhar com este usuário

Estas são preferências que o usuário deixou claras durante a conversa.

- **Idioma:** sempre português.
- **Perfil:** o usuário não programa. Faz tudo por prompts, usando o agente **Kilo Code** no VS Code com o modelo gratuito **Nemotron**, no Windows (terminal PowerShell). Pasta do projeto: `C:\Users\Fabricio Grando\animepull`.
- **Sempre dizer ONDE colocar cada coisa:** "no chat do Kilo (sessão nova, com o Nemotron)", "no terminal do VS Code, na pasta do projeto", "no navegador", "neste chat", "no explorador de arquivos do Windows". O usuário reclamou quando isso faltou.
- **Um comando de cada vez no terminal.** Quando dois comandos grudaram na mesma linha, deu erro.
- **Lembrete de commit ao final de toda resposta que envolva mudança no projeto**, com o comando pronto (pedido explícito do usuário: "sempre me lembre disso"):
  ```
  git add .
  git commit -m "descrição curta"
  git push
  ```
  Só mandar commitar depois de testar. Não commitar um estado quebrado.
- **Prompts para o Kilo: curtos, com uma única mudança.** Os primeiros prompts, longos e escritos sem ver o código, quebraram coisas (o usuário reclamou: "vc esta cagando tudo"). Depois disso o método passou a ser: ver o código real, escrever um pedido pequeno apontando o arquivo e a linha.
- **Não afirmar a causa de um bug sem ter visto o código.** Marcar como hipótese e dizer como confirmar. Houve um erro de leitura de print (a IA disse que os slots estavam "aparecendo certo" quando a carta em destaque tinha sumido); ler os prints com cuidado e, se houver dúvida, perguntar.
- **Dar uma lista curta "O que conferir"** no navegador depois de cada pedido, e pedir `git diff --stat` para ver o tamanho da mudança. Se mexeu em mais arquivos ou muito mais linhas do que o esperado, desfazer com `git restore .` (apaga alterações não salvas; avisar antes de rodar).
- Quando algo der errado, pedir a mensagem exata do console (F12) ou do terminal, ou um print, em vez de chutar.
- O Kilo não obedece 100%: às vezes reescreve arquivos ou não aplica o pedido. Conferir sempre com `git status` e `git diff --stat`.
- **Não afirmar direitos sobre personagens ou marcas de terceiros**; avisar o risco se o usuário quiser distribuir o jogo. Não copiar nome, logo ou arte de outros jogos.
- O que não foi verificado (preços, limites, nomes de menus, versões) deve ser dito como não verificado.
- Valores sugeridos (chances, tempos, cores) são sugestões; o usuário pode mudar.
- **Artes** (menu, capas, packs, versos etc.) o usuário faz no ChatGPT. Quando pedir arte, entregar o prompt em inglês, com medidas exatas em pixels e fundo transparente.

---

## 2. O projeto

**AnimePull**: jogo de abrir packs de cartas de personagens de anime (estilo gacha), com os 500 personagens mais favoritados do AniList.

- **Stack:** React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion. Roda só no navegador, sem backend. Tudo salvo em `localStorage`.
- **Dados:** API GraphQL pública da AniList. 10 páginas de 50 personagens, com proxy do Vite, retry, filtro de conteúdo adulto e cache de 24 h.
- **Futuro:** virar programa de desktop (Electron). Por isso as imagens ficam em `public/` e são acessadas com `import.meta.env.BASE_URL`, nunca com caminho absoluto.
- **Raridades (fixas, nunca mudam com o tema), cor e chance:**

| Raridade | Cor | Chance |
|---|---|---|
| Comum | #9ca3af | 55% |
| Incomum | #22c55e | 25% |
| Raro | #3b82f6 | 12% |
| Épico | #a855f7 | 5% |
| Lendário | #fbbf24 | 2,5% |
| Mítico | #f43f5e | 0,5% |

  A raridade de cada personagem vem da posição no ranking de favoritos. Cada pack traz 5 cartas.
- **Abertura de pack:** pack (rasgo) → pilha (revelação) → resumo, com efeitos por raridade.
- **Temas (10 packs):** ids no código: `manga-pop`, `shounen`, `shoujo`, `seinen`, `josei`, `isekai`, `mecha`, `esportes`, `sobrenatural`, `slice`. Cada tema tem o campo `arquivo` (ex.: `pack-manga-pop.webp`, imagens em `public/packs/`).
- **Molduras por raridade:** `public/molduras/`, canvas 1024x1536, carta 768x1152 centrada (margens de 128 px nas laterais e 192 px em cima e embaixo). Componentes `RarityFrame` e `FrameFX`.
- **Coleção (estado original):** sem duplicatas por `id`; só aparece como contador ("Coleção: N", antes 227 cartas do usuário). A aba Coleção era só um placeholder "Em breve". "Moedas: 0" é texto estático.
- **Não existem:** painel administrativo, autenticação, transformações de personagens, testes.
- **Pendências registradas no `PROJECT_CONTEXT.md`:** `FlipCard.tsx` e `LoadingSkeleton.tsx` sem uso (código morto); assets órfãos (`public/verso da carta/` até então, `matsuri-pack.png`); `handleOpenPack` troca o tema automaticamente a cada pack aberto; possível erro em `StackPhase.tsx` linha ~120 se `current` for `undefined`; `onCancel` recebido em `PackOpeningScreen` e nunca usado.

---

## 3. Objetivos do usuário e roadmap

### Pedidos originais do usuário (resumo fiel)
1. A abertura de pack estava feia e sem fluidez.
2. Na tela inicial devia aparecer só o pack, sem as cartas pequenas ao lado.
3. Ao abrir o pack, os slots reduzidos devem estar **vazios** e ser **preenchidos conforme as cartas são reveladas**.
4. Aplicar os **fundos/versos das cartas** (artes já prontas, nomeadas conforme o pack).
5. Tela inicial perfeita, com **seleção manual de pack** (não aleatória).
6. **Cartas organizadas por pack:** Shounen só com cartas de Shounen; o pack Manga Pop é o variado, com todo tipo de carta.
7. Estrutura para **milhares de cartas**, com **progresso salvo** e **coleção sempre guardada**.
8. Um **executável** para abrir o jogo.
9. **Ver as cartas da coleção** (não só um número).

### Fases (detalhes completos no `ROADMAP.md`)
- **Fase 0:** corrigir a abertura (fluidez + slots).
- **Fase 1:** versos das cartas por pack.
- **Fase 2:** tela inicial perfeita + seleção manual de pack.
- **Fase 3:** cartas separadas por pack.
- **Fase 4:** estrutura para milhares de cartas + progresso salvo + aba Coleção.
- **Fase 5:** pipeline de artes (ChatGPT).

### Decisões em aberto (o usuário ainda não respondeu)
1. Raridade por pack ou global? A mesma personagem pode mudar de raridade conforme o pack?
2. Como classificar Shounen/Shoujo/Seinen/Josei? (o AniList não tem isso como gênero: usar tags de demografia da mídia ou lista manual?)
3. Packs de nicho pequenos: aceitar pool menor?
4. Duplicatas contam (ter 3x a mesma carta) ou continua sem repetição?
5. ~~Moedas~~ Decidido pelo usuário, ver o bloco "Sistema de packs, timer e moedas" abaixo. Falta definir os valores numéricos listados lá.
6. (Surgiu nos prompts de catálogo) Posições 501 em diante do catálogo entram como **Comum**, mantendo as 500 atuais com a raridade de hoje. É sugestão da IA, não decisão do usuário.

### Sistema de packs, timer e moedas (decidido pelo usuário)
- Packs: o jogador começa com 10. Pode aumentar depois, comprando na Loja com moedas.
- Timer: recupera 1 pack a cada X tempo. Ao chegar a zero, ganha 1 pack padrão "AnimePull" (que tem todas as categorias). Packs de categoria só têm cartas da categoria.
- O jogo fechado também acumula packs.
- Moedas: (1) uma pequena quantidade por pack aberto, independente de onde veio o pack (grátis ou pago); (2) ao completar sets.
- Loja: compra packs com moedas e dá recompensas.
- Futuro: sistema AFK, em que o jogador coloca cartas para fazer missões que dão packs e moedas.
- **Ainda sem valor definido:** o tempo X do timer, o limite de acúmulo (se houver), a quantidade de moedas por pack, o preço dos packs na Loja, as recompensas da Loja, as regras do AFK.
- **Pergunta em aberto (a IA fez, o usuário ainda não respondeu):** os packs formam um único contador ("Packs 10") ou cada tipo tem o seu (AnimePull de um lado, de categoria do outro)? Se for um só, abrir um pack de categoria gasta 1 do mesmo número que o timer enche?
- Consequências apontadas pela IA (explicação geral, sem ter visto o código): abrir pack passa a gastar 1 pack e, com zero, o botão fica indisponível (hoje não há limite); o timer deve ser guardado como **horário** no save (não como contagem na tela), e ao abrir o jogo calcula-se quantos packs foram ganhos no intervalo; como não há servidor, mudar a hora do Windows pode enganar o cálculo; o formato do save precisa prever packs, moedas e horário antes do prompt 6 da coleção (seção 10.8), para evitar uma segunda migração.
- Plano em partes sugerido pela IA (não saiu do usuário): (1) estado salvo de packs, moedas e horário do próximo pack, sem mexer na aparência; (2) gastar 1 pack ao abrir + timer com acúmulo no jogo fechado; (3) moedas por pack aberto; (4) a interface passa a mostrar esses dados; (5) Loja, moedas por set completo e AFK ficam como "EM BREVE" até chegar a vez deles. Valores indefinidos ficam como constantes fáceis de mudar.

### Design system da interface (recebido em 18/11/2026)
O usuário enviou um texto de especificação ("ANIMEPULL - UI DESIGN SYSTEM SPECIFICATION", versão 1.0) e 4 imagens de mockup (tela Packs em desktop em duas versões, painel de componentes e tela Packs em celular). O texto da spec deve ser salvo na raiz do projeto como `DESIGN_SYSTEM.md` (o usuário ainda não confirmou que fez; commit sugerido `docs: design system da interface`).

Resumo fiel da spec:
- **Estilo:** "Flat Comic-Pop / Premium Collectible Game". Interface escura, cores sólidas, sem gradientes, blur, glow ou texturas na interface; profundidade por contornos de 2px e **sombras duras** (4px 4px 0 blur, cor #050509; ao pressionar, sem sombra e o elemento desloca 4px para a direita e para baixo). Todo o texto em português do Brasil. Desktop primeiro, responsivo.
- **Cores base:** fundo #0B0B14, painel #151528, painel elevado #1D1D36, borda #2A2A4A, texto #E5E7EB, texto secundário #9CA3AF, texto escuro #0B0B14. **Acentos:** magenta #FF2E93, amarelo #FFD60A, ciano #1EC8FF. **Raridades:** as mesmas do projeto (Comum #9CA3AF, Incomum #22C55E, Raro #3B82F6, Épico #A855F7, Lendário #FBBF24, Mítico #F43F5E), sempre fixas, independentes do tema.
- **Acento por pack (dinâmico):** Manga Pop #FF2E93, Shounen #FFD60A, Shoujo #F48FB1, Seinen #D62828, Josei #9B6BFF, Isekai #2ECC8F, Mecha #2F8FE0, Esportes #FF8A1F, Sobrenatural #D63A2F, Slice of Life #4FB3F0.
- **Tipografia:** Poppins (reserva Montserrat), só pesos 700 e 800; títulos e navegação em maiúsculas com leve espaçamento entre letras. Escala: 12, 14, 16, 18, 20, 24, 32, 40 px.
- **Espaçamento:** base de 8px (XS 4, SM 8, MD 16, LG 24, XL 32, 2XL 48, 3XL 64). **Bordas:** 2px sólidas; painéis reservados com 2px tracejada #9CA3AF. **Raios:** 12px (cartões, painéis, botões, campos), 8px (badges pequenos), 999px (chips), 50% (ícones circulares).
- **Layout desktop (base 1920x1080):** sidebar 240px (recolhida 72px), barra superior 80px, coluna de informações à direita de 320px. **Celular (base 390x844):** sidebar vira navegação inferior de 72px, barra superior compacta com logo e chips, faixa de sets com rolagem horizontal, sem rolagem horizontal da página. Breakpoints: 0-767 celular, 768-1199 tablet (sidebar recolhida), 1200-1599 desktop, 1600+ desktop grande.
- **Componentes listados:** navegação (sidebar expandida/recolhida, itens ativo/hover/bloqueado, selo EM BREVE, slot reservado, perfil, configurações, menu "Mais" no celular), cabeçalho (logo, título, contadores de packs/moedas/coleção, toggle de efeitos, notificações, avatar), botões, packs e sets, chips e badges, painéis, controles de formulário, feedback (toasts, barra de progresso, tooltip, modais) e componentes futuros (Loja, Missões, Conquistas, Troca, Eventos, Perfil, Configurações...). Princípios: componentes reutilizáveis, tokens centralizados, acento primário dinâmico, novos itens de menu sem redesenhar a sidebar.

Observações da IA sobre os mockups (o usuário ainda não confirmou as suposições abaixo):
- Os dois mockups de desktop diferem entre si (logo, chips, rótulos); o primeiro parece escrever "Puil" na logo. Suposição: a spec em texto manda e a logo é o arquivo real gerado no ChatGPT.
- Nos mockups, o pack no centro é um cartão rosa com uma estrela. Suposição: no jogo aparece a arte real de `public/packs/`.
- Conflito com o `PROJETO.md`: ele diz "sem fonte externa" e o jogo vai virar desktop. Suposição: os arquivos da fonte Poppins ficam dentro do projeto (`public/fonts/`), sem link externo, e o `PROJETO.md` ganha essa exceção.
- Suposição: "sem gradiente, blur e glow" vale só para a interface (menus, painéis, botões); a abertura do pack e as cartas mantêm os efeitos atuais.
- **Dados dos mockups:** "Packs 10", "Próximo pack grátis em 12:30" e "Atividade recente" eram mock (dados de mentira) naquele momento. Como o usuário decidiu implementar packs, timer e moedas de verdade (bloco acima), passam a ser dados reais, mas só entram na tela depois que o estado salvo existir. Até lá, mostrar só o que é real (Coleção e Efeitos) e deixar os painéis como "EM BREVE" ou "Espaço reservado", sem números inventados. "Moedas: 0" já é texto fixo hoje. **Mock** = dado de mentira, número ou texto na tela que o jogo não calcula nem guarda; a regra "Sem dados falsos (mock)" do `PROJETO.md` proíbe isso, mas não proíbe um painel honesto "EM BREVE".
- Plano em passos pequenos sugerido pela IA (não saiu da spec): (1) tokens centrais (cores, tipografia, espaçamento, sombras duras) e fonte local; (2) casca do app: sidebar e barra superior no desktop, com as abas atuais funcionando; (3) tela Packs: painel central, faixa de Sets que troca o tema e coluna da direita; (4) celular: barra inferior e menu "Mais"; (5) componentes de apoio só os que as telas usam. Cada passo vira um pedido curto ao Kilo, com teste e commit antes do próximo.
- Para escrever os pedidos, a IA precisa ver `src/App.tsx`, `src/components/AppShell.tsx`, `src/components/PacksTab.tsx` e `src/style.css` (links `blob/master/...` do GitHub ou anexos). Ainda não foram enviados.

### Ordem combinada para executável e coleção
1. Agora: arquivo `.bat` para abrir o jogo com dois cliques.
2. Estrutura da coleção, começando por backup (exportar/importar).
3. Por último, o `.exe` de verdade (Electron). Motivo (explicação geral, sem ter visto o código): a coleção fica guardada no armazenamento do navegador por endereço; um programa de desktop tem armazenamento separado, então as cartas não apareceriam lá sem o backup.

---

## 4. Estado atual

### Feito e confirmado pelo usuário
- Fase 0A: **slots reduzidos aparecem ao lado da carta** durante a abertura ("a tela ficou correta").
- Layout da fase das cartas corrigido (barra "Pular" acima, carta centralizada).
- Transição suave pack → pilha e correção do tempo vazio / linha colorida do rasgo. O usuário confirmou: "ficou bem melhor".
- `PROJETO.md` criado e commitado (regras fixas, commit `a25f115`).
- Projeto enviado ao GitHub (22 commits na ocasião; último "abertura: linha do rasgo some ao separar").
- Pedido de remover o `PackSlotsPanel` da tela inicial foi aplicado (não conferi por print).

### Em andamento ou pendente de confirmação
- **Versos (Fase 1):** as 10 artes existem em `public/verso da carta/` (isekai, josei, manga-pop, mecha, seinen, shoujo, shounen, slice-of-life, sports, supernatural), mais 2 arquivos de nome diferente (`Cartão AnimePull_ Verão na Escola.png`, `Explosão Pop Art AnimePull.png`, finalidade desconhecida). No último print visto, o verso do sports ainda estava como `animepull-back-sports-transparent(1).png` (o arquivo vazio de 0 bytes já tinha sido removido). Os comandos para renomear/mover para `public\versos\verso-{id-do-tema}.png` foram passados (seção 7), mas **o usuário não confirmou que rodou**. Falta ainda: ligar o verso de cada tema ao `CardBack`.
- **Launcher `iniciar-jogo.bat`:** o Kilo criou com só 2 linhas; foi recriado via PowerShell (seção 7). O erro "Port 5173 is already in use" aconteceu porque o `npm run dev` já estava rodando. **Falta testar depois de religar o PC e fazer o commit.**
- **Coleção:** os prompts da seção 10 (backup, grade de cartas, 6 prompts de coleção/catálogo) foram entregues, **mas nenhum foi confirmado como executado**.
- **Design system:** spec e mockups recebidos (ver seção 3); nenhum pedido ao Kilo escrito ainda. Pendente: salvar `DESIGN_SYSTEM.md` na raiz, responder a pergunta do contador de packs e enviar os 4 arquivos de código citados na seção 3.
- **Packs, timer e moedas:** regras decididas pelo usuário (seção 3); nenhum pedido escrito ainda.
- Arquivo solto na raiz do projeto com nome quebrado ("o da carta… git commit -m … tema aplicado ao…"): aparece no GitHub; a IA sugeriu abrir, ver o conteúdo e apagar se for lixo. Usuário não respondeu.

### Ainda não iniciado
Seleção manual de pack (Fase 2), cartas por pack (Fase 3), aplicação do design system, sistema de packs/timer/moedas, Loja, AFK, executável Electron, conversão das artes para `.webp` (os PNGs têm cerca de 2 MB cada), baixar e hospedar as imagens dos personagens, IndexedDB.

---

## 5. Conhecimento do código (lido em 17/11/2026; pode ter mudado)

Arquivos em `src/components/` (e `src/themes/`). Estes fatos foram lidos diretamente do código ou de arquivos enviados.

**PackOpeningScreen.tsx** (versão lida antes dos pedidos de transição/tempo)
- Props: `cards`, `collection`, `setCollection`, `onComplete`, `onCancel` (recebido como `_onCancel`, não usado).
- Fases: `'pack' | 'stack' | 'summary'`. Tem estado `revealedSlots` (5 posições) e `handleReveal`.
- Renderiza `PackSlotsPanel` quando `phase !== 'pack'`. Espaço rasga o pack.
- Havia `setTimeout(() => setPhase('stack'), 1300)` após o rasgo; depois dos pedidos aplicados esse tempo foi mexido (não vi o código final).

**StackPhase.tsx**
- Props: `cards`, `onSave`, `onReveal`, `onComplete`. Ordena as cartas por raridade crescente; vira e guarda; modal de "Pular".
- A `<section>` raiz era `fixed inset-0 z-[9999]` com fundo opaco, o que escondia o painel de slots. Foi trocada por `relative flex-1 w-full flex items-center justify-center`.

**PackSlotsPanel.tsx**
- Props: `cards` (`(Character | null)[]`), `collection`, `className`, `slotRefs`, `animate`.
- Grade `grid-cols-2`; slot vazio usa `CardBack`; mostra o contador "Coleção: N".

**TearablePack.tsx**
- `onTearComplete` dispara em 1150 ms; partículas aos 560 ms; `TEAR_Y = 0.065`.
- A linha de luz usa a cor da raridade mais alta do pack. Animações CSS (`pack-top-fly`, `pack-body-drop`, `light-line` etc.) vivem no `style.css`.

**CardFront.tsx**
- Exporta `CardFront` e `CardBack`; `CardBack` só embrulha o `CardBack` de `../themes/CardBack`.

**themes/index.ts e types.ts**
- 10 temas, todos usando o mesmo `PackArt` e o mesmo `CardBack`. `pickRandomTheme(excludeId)` existe.
- `Theme` tem: `id`, `name`, `arquivo`, `palette`, `CardBack?`, `PackArt?`, `Background?`. **Não tem campo `verso`.**
- `src/themes/CardBack.tsx` **ainda não foi lido** (leitura deu limite de taxa; o usuário ainda não enviou). Sem ele não dá para escrever o pedido do verso.

**Mapeamento arte de verso → tema**

| Arquivo da arte | id do tema |
|---|---|
| manga-pop, shounen, shoujo, seinen, josei, isekai, mecha | mesmo nome |
| slice-of-life | `slice` |
| sports | `esportes` |
| supernatural | `sobrenatural` |

---

## 6. GitHub: como a IA lê o projeto

- Repositório público: `https://github.com/fabriciogrando0-prog/animepull` (branch `master`).
- A leitura da **página da raiz** do repositório volta como cópia antiga, vazia (cache). A página de **pastas** (`/tree/...`) é bloqueada para leitura automática (`ROBOTS_DISALLOWED`).
- **Funciona:** a página de um **arquivo** (`.../blob/master/src/...`), colada pelo usuário no chat. A IA só abre endereços que o usuário colar; não adivinha caminhos. Às vezes bate no limite de leituras; esperar um pouco ou anexar o arquivo pelo botão de anexar (anexar funciona sempre).
- Alternativa: o usuário compacta a pasta `src` em zip e anexa.
- A IA só vê o que já foi enviado: depois de cada commit, rodar também `git push`.
- Conector do GitHub: a busca no diretório de conectores não mostrou um; não verificado se existe. Foi mencionado o Claude Code como ferramenta que lê a pasta do computador em tempo real (preço, plano e instalação não verificados).

---

## 7. Git e comandos úteis (PowerShell, na pasta do projeto)

Rodar um por vez.

```
git status
git diff --stat
git diff -w --stat
git log --oneline -8
git restore .
```

- `git diff -w --stat` ignora diferenças de espaço (útil quando o Kilo só reindentou código).
- `git restore .` descarta alterações não salvas de arquivos já existentes. Avisar antes.
- Evitar `git reset --hard` (apaga trabalho sem volta). Para desfazer um commit já feito, `git revert <código-do-commit>`.
- Endereço do GitHub: `git remote set-url origin https://github.com/fabriciogrando0-prog/animepull.git` e depois `git push -u origin master`.

**Mover e renomear as artes de verso (só depois de conferir com `dir "public\verso da carta"`; o seinen e o sports não podem ter `(1)` nem 0 bytes):**

```
Rename-Item -LiteralPath "public\verso da carta\animepull-back-sports-transparent(1).png" -NewName "animepull-back-sports-transparent.png"
```

```
New-Item -ItemType Directory -Path "public\versos"
```

```
$m=@{'manga-pop'='manga-pop';'shounen'='shounen';'shoujo'='shoujo';'seinen'='seinen';'josei'='josei';'isekai'='isekai';'mecha'='mecha';'slice-of-life'='slice';'sports'='esportes';'supernatural'='sobrenatural'}; foreach($k in $m.Keys){ Move-Item -LiteralPath "public\verso da carta\animepull-back-$k-transparent.png" -Destination "public\versos\verso-$($m[$k]).png" }
```

Conferir com `dir public\versos`: devem aparecer 10 arquivos `verso-<id>.png`. Commit sugerido: `versos: organiza artes em public/versos`.

**Launcher `iniciar-jogo.bat` (criar pelo terminal, em uma linha):**

```
Set-Content -Path iniciar-jogo.bat -Encoding ASCII -Value '@echo off','cd /d "%~dp0"','title AnimePull','npm run dev -- --open --port 5173 --strictPort','pause'
```

O arquivo deve ter 5 linhas (`type iniciar-jogo.bat` para conferir). Notas:
- A porta é fixa (5173) porque o navegador guarda a coleção por endereço; se o jogo abrir em outra porta, a coleção "some".
- Não rodar `npm run dev` no VS Code ao mesmo tempo (disputam a porta; erro "Port 5173 is already in use").
- Para achar e encerrar quem usa a porta (confirmar que o processo é `node` antes de encerrar):

```
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173 -State Listen).OwningProcess
```

```
Stop-Process -Id NUMERO
```

- A janela preta deve ficar aberta enquanto joga; fechar a aba do navegador sozinha deixa o servidor rodando.
- Precisa do Node instalado e da pasta do projeto no mesmo lugar.
- Commit sugerido: `launcher: iniciar-jogo.bat`.

---

## 8. Molde de prompt para o Kilo e regras do `PROJETO.md`

**Onde colar:** no chat do Kilo, em sessão nova, com o Nemotron.

**Molde:**

```
Leia o `PROJETO.md`, se existir, e [arquivos relevantes]. [O que quero, em uma frase.] Edições pontuais:
1. [Item com valores exatos.]
2. [Item com valores exatos.]
Não altere [o que não deve ser tocado]. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Boas práticas do molde: itens numerados com valores exatos (cores em hex, px, %, nomes de arquivo e props); dizer o que NÃO alterar; "edições pontuais, sem reescrever o arquivo inteiro"; arquivos novos pequenos (até ~200 linhas); antes de editar uma tela, pedir ao Kilo que mostre o arquivo e o trecho que a renderiza; sempre terminar com `npm run build` e a regra das 3 tentativas.

**Conteúdo do `PROJETO.md` (já criado na raiz do projeto):**

```
# AnimePull

Jogo de abrir packs de cards de personagens de anime. React + Vite + TypeScript + Tailwind CSS 4 + framer-motion. Dados da API pública da AniList (500 personagens mais favoritados, cache em localStorage). Progresso salvo em localStorage. Vai virar programa de desktop (Electron): imagens em public/, acessadas com import.meta.env.BASE_URL.

Documentação técnica completa em PROJECT_CONTEXT.md e plano de fases em ROADMAP.md (se existirem). Leia esses arquivos antes de qualquer tarefa.

## Raridades (fixas, nunca mudam com o tema)
Comum #9ca3af (55%), Incomum #22c55e (25%), Raro #3b82f6 (12%), Épico #a855f7 (5%), Lendário #fbbf24 (2,5%), Mítico #f43f5e (0,5%). A raridade vem da posição no ranking de favoritos.

## Regras fixas
- Faça só o que foi pedido, com edições pontuais. Nunca reescreva um arquivo inteiro sem ser pedido.
- Componentes novos em arquivos próprios, de no máximo ~200 linhas.
- Não altere sorteio, API, lógica da abertura nem temas, a menos que o pedido diga.
- Centralize com flexbox, nunca com absolute + transform.
- Anime só transform e opacity.
- Sem dados falsos (mock). localStorage sempre com try/catch.
- Imagens em public/, via import.meta.env.BASE_URL.
- Arte desenhada só em SVG/CSS, sem imagem nem fonte externa.
- Nenhum ancestral com overflow hidden cortando efeitos que vazam para fora da carta.
- Antes de editar uma tela, diga qual arquivo e qual linha a renderiza, mostrando o trecho.
- Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e explique o problema.
```

---

## 9. Prompts que funcionaram (já aplicados)

### 9.1 Layout da fase das cartas (barra "Pular" escondida atrás da moldura)

```
Numa sessão nova, com o Nemotron:

Na fase `stack` da abertura de pack (`StackPhase.tsx`, e `PackOpeningScreen.tsx` se for o container), o layout está quebrado: a barra superior ("Toque na carta para virar (Espaço)" + botão "Pular") fica parcialmente escondida atrás da moldura rosa da carta, desalinhada para a esquerda e com o botão "Pular" cortado. A moldura rosa também não está centralizada na tela. Faça edições pontuais só de layout/CSS, sem mexer no sorteio, nas raridades, nas molduras por raridade, no verso das cartas (a carta fechada pode continuar mostrando a arte do pack por enquanto) nem nas animações:

1. Diagnostique primeiro: abra `StackPhase.tsx` e o container em `PackOpeningScreen.tsx` e me diga quais classes/estilos fazem a barra superior e a moldura rosa terem larguras, posições e `z-index` diferentes (procure `absolute`/`fixed`, `w-`, `max-w-`, `translate`, `left-`, `z-`).
2. Coloque barra superior, carta e legenda ("Clique para revelar") num único container centralizado (`flex flex-col items-center`, largura máxima única, `mx-auto`), em fluxo normal, sem posicionamento absoluto para a barra.
3. A barra deve ficar acima da moldura, com o texto à esquerda e o botão "Pular" à direita, inteiramente visível e clicável (`z-index` maior que a moldura).
4. A moldura rosa deve envolver só a área da carta, centralizada, com padding uniforme; a carta fechada deve ocupar a moldura com proporção 2:3 (1024x1536) sem sobrar espaço vazio.
5. Garanta que funcione em tela de celular (390 px de largura) e em desktop (1440 px), sem rolagem horizontal.
6. Teste no navegador nas duas larguras: a barra não pode ser cortada nem ficar atrás da moldura, e a carta deve ficar centralizada. Diga o que encontrou e o que mudou.
7. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit usado: `abertura: layout da pilha`.

### 9.2 Slots visíveis ao lado da carta (a causa era a `<section>` raiz do `StackPhase` cobrindo tudo)

```
Leia o PROJETO.md. Edição pontual só em src/components/StackPhase.tsx. O PackSlotsPanel está sendo coberto pela <section> raiz do StackPhase, que é fixed inset-0 com fundo opaco.

1. No return, troque a abertura da <section> raiz:
   DE:   <section className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: theme.palette.bg }}>
   PARA: <section className="relative flex-1 w-full flex items-center justify-center">
2. Se `theme` e `useTheme` ficarem sem uso depois disso, remova a linha `const { theme } = useTheme()` e o import de useTheme, para o build não falhar.

Não altere mais nada: nem PackOpeningScreen.tsx, nem PackSlotsPanel.tsx, nem o flash do Mítico, nem a barra "Pular", nem as animações. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit usado: `abertura: slots visiveis ao lado da carta`.

### 9.3 Transição suave pack → pilha

```
Leia o PROJETO.md. Edição pontual só em src/components/PackOpeningScreen.tsx. Objetivo: a troca entre a fase 'pack' e a fase 'stack' hoje é um corte seco. Faça uma transição suave.

1. Importe { AnimatePresence, motion } de 'framer-motion'.
2. No bloco <div className="flex-1 flex flex-col items-center justify-center gap-4 min-w-0">, envolva os dois blocos condicionais ({phase === 'pack' && ...} e {phase === 'stack' && ...}) em <AnimatePresence mode="wait">.
3. Dentro de cada bloco condicional, troque o fragmento/elemento raiz por um <motion.div> com key própria ('pack' e 'stack'), mantendo exatamente o mesmo layout de antes:
   - fase pack: className="flex flex-col items-center gap-4", initial={{ opacity: 0, scale: 0.96 }}, animate={{ opacity: 1, scale: 1 }}, exit={{ opacity: 0, scale: 1.04 }}, transition={{ duration: 0.25, ease: 'easeOut' }}
   - fase stack: className="flex-1 w-full flex items-center justify-center", initial={{ opacity: 0 }}, animate={{ opacity: 1 }}, exit={{ opacity: 0 }}, transition={{ duration: 0.35, ease: 'easeOut' }}
4. Anime só opacity e scale.

Não altere: o tempo do setTimeout de 1300, o TearablePack, o StackPhase, o PackSlotsPanel, o sorteio nem os efeitos de tela. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit usado: `abertura: transicao suave pack para pilha`. Nota: o diff mostrou 40 inserções/23 remoções em um arquivo; a hipótese é que foi reindentação por causa do `AnimatePresence` (confirmável com `git diff -w --stat`).

### 9.4 Tempo vazio entre o rasgo e as cartas + tecla Espaço rasga

```
Leia o PROJETO.md. Edições pontuais em src/components/PackOpeningScreen.tsx e src/components/TearablePack.tsx. Objetivo: tirar o tempo vazio entre o fim do rasgo e a primeira carta, e fazer a tecla Espaço rodar a animação do rasgo.

Em TearablePack.tsx:
1. Em TearablePackProps, adicione a prop opcional `startSignal?: boolean` e inclua `startSignal` na desestruturação dos parâmetros do componente.
2. Logo depois da definição de `start` (o useCallback), adicione:
   useEffect(() => { if (startSignal) start() }, [startSignal, start])

Em PackOpeningScreen.tsx:
3. Adicione o estado `const [spaceTear, setSpaceTear] = useState(false)`.
4. No handler de teclado (onKeydown), na fase 'pack', troque a chamada `tearPack()` por `setSpaceTear(true)`. Mude o array de dependências desse useEffect de [phase, tearPack] para [phase].
5. No <TearablePack ... />, adicione a prop `startSignal={spaceTear}`.
6. No useEffect que faz setTimeout(() => setPhase('stack'), 1300), troque 1300 por 150.
7. No <motion.div key="pack">, troque o exit atual por: exit={{ opacity: 0, transition: { duration: 0.1 } }}

Não altere: o tempo de 1150 ms em TearablePack, as animações do rasgo, o StackPhase, o PackSlotsPanel, o sorteio nem os efeitos de tela. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit usado: `abertura: tempo entre rasgo e cartas`.

### 9.5 Linha colorida do rasgo some ao separar

```
Leia o PROJETO.md. Edição pontual só em src/components/TearablePack.tsx. Objetivo: a linha colorida do rasgo e os feixes de luz ficam parados na tela depois que o pack se separa. Eles devem sumir suavemente.

1. No JSX do return, localize as duas linhas consecutivas `<div style={lineStyle} />` e `<div style={beamsStyle} />`.
2. Envolva as duas num único wrapper, mantendo as duas dentro dele:
   <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: exploding ? 0 : 1, transition: 'opacity 0.25s ease-out' }}>
     <div style={lineStyle} />
     <div style={beamsStyle} />
   </div>

Não altere: lineStyle, beamsStyle, as partículas, o innerLightStyle, os tempos nem nenhum outro arquivo. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit usado: `abertura: linha do rasgo some ao separar`.

### 9.6 Criação do `PROJETO.md`
O prompt é o da seção 8 (conteúdo do arquivo), pedindo ao Kilo para criar o arquivo sem alterar nenhum outro. Commit: `docs: regras fixas no PROJETO.md`.

---

## 10. Prompts prontos, ainda NÃO confirmados como executados

**Onde colar todos:** no chat do Kilo, sessão nova, com o Nemotron. Um por vez, testando e fazendo commit entre eles.

### 10.1 Backup da coleção (exportar/importar)

Ainda não vi o `App.tsx`; o prompt manda o Kilo confirmar a chave do `localStorage` antes de editar (a chave `animepull_collection` vem do `PROJECT_CONTEXT.md`). Se a grade (10.2) já substituiu o placeholder da aba Coleção, o Kilo adapta a posição.

```
Leia o PROJETO.md. Quero um backup da coleção em arquivo. Antes de editar:
(a) procure em src/ todo uso de localStorage e me diga a chave exata onde a coleção é salva e o formato do valor (array de personagens?);
(b) diga qual arquivo renderiza a aba "Coleção" (hoje é um placeholder "Em breve") e mostre o trecho do return.
Só continue se a coleção estiver em localStorage; se estiver em outro lugar, pare e me explique.

Depois faça só isto:
1. Crie src/components/CollectionBackup.tsx (máximo 120 linhas) com dois botões, "Exportar coleção" e "Importar coleção", e uma linha de texto de status abaixo deles.
2. Exportar: leia a coleção do localStorage (usando a chave confirmada em (a), dentro de try/catch), monte um JSON { "app": "animepull", "version": 1, "exportedAt": "<data ISO>", "collection": [...] } e baixe com Blob + <a download>, com o nome animepull-colecao-AAAA-MM-DD.json. Se a coleção estiver vazia, mostre no status "Coleção vazia, nada para exportar" e não baixe nada.
3. Importar: <input type="file" accept=".json"> escondido, acionado pelo botão. Leia o arquivo, valide dentro de try/catch: app === "animepull", version === 1, collection é array e cada item tem id numérico, name.full e image.large. Se for inválido, mostre no status "Arquivo inválido" e não altere nada.
4. Se for válido, MESCLE com a coleção atual por id (nunca apague cartas existentes; em caso de id repetido, mantenha a que já está salva), grave no localStorage com a mesma chave e o mesmo formato de antes (try/catch), mostre no status "X cartas novas importadas" e chame window.location.reload() depois de 1 segundo.
5. Renderize <CollectionBackup /> na aba Coleção, abaixo do texto atual, sem remover nada do que já existe lá.
6. Estilo com as classes Tailwind e as cores do tema que o projeto já usa; botões pequenos, lado a lado, responsivos em 390 px.

Não altere: sorteio, raridades, App.tsx, abertura de pack, temas nem a forma como a coleção é salva hoje. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Conferir: na aba Coleção aparecem os dois botões; exportar baixa `animepull-colecao-....json` com as cartas (o usuário tinha 227); importar o mesmo arquivo dá "0 cartas novas importadas"; um `.json` qualquer dá "Arquivo inválido". Depois de exportar, guardar uma cópia do arquivo fora da pasta do projeto. Commit: `colecao: exportar e importar backup`.

### 10.2 Grade das cartas que o usuário tem

```
Leia o PROJETO.md. Quero ver as cartas da coleção na aba "Coleção" (hoje é só um placeholder "Em breve").

Antes de editar, me mostre: (a) qual arquivo renderiza a aba Coleção e o trecho do return; (b) onde a coleção (array de Character) está guardada e como chega até essa aba. Se a aba ainda não recebe a coleção, passe-a por prop (a coleção já existe no App e é passada ao PackOpeningScreen como `collection`).

Depois faça só isto:
1. Crie src/components/CollectionGrid.tsx (máximo 150 linhas), com a prop `collection: Character[]` (tipo importado de './RarityBadge').
2. No topo: "Coleção: N cartas" e, ao lado, a contagem por raridade (uma linha de chips pequenos, só as raridades que têm cartas).
3. Grade responsiva: grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6, gap-3. Cada carta é um div com aspect-[2/3], rounded-xl, overflow-hidden, relative, borda de 2px na cor RARITY_COLORS[rarity].primary (de './RarityBadge').
4. Dentro de cada carta: <img src={character.image.large} className="w-full h-full object-cover" loading="lazy" decoding="async" alt={character.name.full} />, e na parte de baixo uma faixa bg-black/60 com o nome (line-clamp-1, text-[11px]) e a raridade (text-[10px]).
5. Ordenação fixa: da raridade mais alta para a mais baixa (Mítico, Lendário, Épico, Raro, Incomum, Comum) e, dentro da mesma raridade, por character.favourites decrescente. Use useMemo.
6. Coleção vazia: mostre "Você ainda não tem cartas. Abra um pack!".
7. Renderize <CollectionGrid collection={...} /> na aba Coleção, substituindo o texto "Em breve" e mantendo o resto da aba como está.

NÃO use RarityFrame, FrameFX, Particle nem framer-motion nesta grade (peso). Não altere sorteio, raridades, abertura de pack, temas nem a forma como a coleção é salva. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Conferir: grade com as cartas (não só o número); total bate com o contador (antes 227); Míticas e Lendárias primeiro; borda na cor da raridade; cartas novas aparecem depois de abrir um pack. `git diff --stat` deve mostrar `CollectionGrid.tsx` novo e pequena alteração na aba (e talvez uma linha no `App.tsx`). Commit: `colecao: grade com as cartas`.

### 10.3 Prompt 1: mostrar TODAS as cartas (obtidas e faltando)

```
Leia o PROJETO.md. A aba Coleção já mostra as cartas que tenho (src/components/CollectionGrid.tsx). Quero que mostre TODAS as cartas do jogo: as que tenho e as que faltam.

Antes de editar, me mostre: (a) onde fica a lista completa de personagens carregados (o pool usado no sorteio) e por qual caminho a coleção chega até o CollectionGrid; (b) o trecho do return de CollectionGrid.tsx.

Depois, edições pontuais:
1. Adicione a prop `allCharacters: Character[]` ao CollectionGrid e passe a lista completa pelo mesmo caminho que a coleção já usa.
2. Monte um Set com os ids da coleção. A grade passa a listar allCharacters inteira (useMemo), por posição no ranking (favourites decrescente).
3. Carta que tenho: igual a hoje.
4. Carta que falta: mesmo tamanho e proporção, fundo escuro (bg-black/40), borda cinza fina, "?" grande e centralizado e, embaixo, "#<posição no ranking>". NÃO carregue a imagem nem mostre o nome dessas cartas.
5. No topo: "Coleção: X / Y (Z%)" e três botões de filtro: Todas | Obtidas | Faltando (padrão Todas), com useState.
6. Se allCharacters estiver vazio (ainda carregando), mostre as cartas obtidas como hoje e a linha "Carregando o catálogo...".

Não altere: sorteio, raridades, abertura de pack, temas nem a forma como a coleção é salva. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit: `colecao: mostra todas as cartas`.

### 10.4 Prompt 2: busca, filtros e renderização em partes

```
Leia o PROJETO.md. Em src/components/CollectionGrid.tsx, adicione busca, filtro por raridade, ordenação e renderização incremental (a lista vai crescer para milhares de cartas). Antes de editar, me mostre o trecho do return.

Edições:
1. Campo de busca por nome, filtrando por name.full e name.native, sem diferenciar maiúsculas nem acentos (normalize('NFD')). Use useDeferredValue para não travar a digitação.
2. Chips das 6 raridades, multi-seleção (nenhum marcado = todas).
3. Select de ordenação: "Ranking" (padrão, favourites decrescente), "Raridade" (maior primeiro) e "Nome A-Z".
4. Renderização incremental SEM biblioteca: mostre as primeiras 60 cartas e, quando um <div> sentinela no fim da grade entrar na tela (IntersectionObserver, rootMargin '400px'), mostre mais 60. Volte para 60 sempre que busca, filtro ou ordenação mudarem.
5. Mostre "N resultados" e, com 0 resultados, "Nenhuma carta encontrada".
6. Mantenha os filtros Todas/Obtidas/Faltando.

Não altere nenhum outro arquivo. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit: `colecao: busca, filtros e rolagem incremental`.

### 10.5 Prompt 3: ponto único de acesso à coleção salva (sem mudar comportamento)

```
Leia o PROJETO.md. Quero centralizar o acesso à coleção salva, SEM mudar nada do comportamento. Antes de editar, procure "localStorage" em src/ e me liste cada arquivo e linha que lê ou grava a coleção (chave e formato).

Depois:
1. Crie src/storage/collectionStorage.ts (máximo 80 linhas) exportando `loadCollection(): Character[]` e `saveCollection(cards: Character[]): void`, com a MESMA chave e o MESMO formato de hoje, dentro de try/catch (erro: devolve [] / ignora).
2. Nos outros arquivos, troque o acesso direto ao localStorage da coleção por essas duas funções.
3. Não toque no cache de personagens nem em nenhuma outra chave (tema, efeitos etc.).

Não altere chave, formato, sorteio, abertura de pack nem a tela. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Commit: `storage: acesso centralizado a colecao`.

### 10.6 Prompt 4: catálogo de milhares de cartas gerado por script

```
Leia o PROJETO.md. Quero um catálogo fixo de personagens, gerado por script, para o jogo deixar de depender do top 500 consultado ao vivo. Antes de editar, me mostre: (a) o arquivo e as linhas onde o jogo busca personagens na AniList (query GraphQL, filtro de conteúdo adulto, cálculo de raridade); (b) o formato do objeto Character. Reaproveite EXATAMENTE essa query, esse filtro e essa regra. Se a regra de raridade depender do tamanho total do pool, pare e me explique antes de continuar.

Faça:
1. Crie scripts/build-catalog.mjs (Node, fetch nativo, sem dependências novas).
2. Parâmetro `--limit N` (padrão 5000): busca páginas de 50 por favoritos decrescente até juntar N personagens que passem no filtro de adulto.
3. Espere 1200 ms entre páginas. Em erro 429, espere o Retry-After (ou 30 s) e tente de novo; em outros erros, até 4 tentativas com espera crescente.
4. Salve o progresso a cada página em scripts/.catalog-progress.json e, se o script for interrompido e rodado de novo, continue de onde parou. Adicione esse arquivo ao .gitignore.
5. Raridade: posições 1 a 500 usam a regra de hoje; da posição 501 em diante, 'Comum'.
6. Grave public/catalog/characters.json, um array de Character no mesmo formato que o jogo usa, com `rarity` preenchida, ordenado por favoritos decrescente. No final, mostre quantos personagens foram gravados.
7. Em package.json, adicione o script "catalog": "node scripts/build-catalog.mjs".

Não altere nada em src/ nesta etapa. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Testar primeiro com poucas cartas (terminal do VS Code, jogo fechado): `npm run catalog -- --limit 200`; conferir `public/catalog/characters.json`; se estiver bom, `npm run catalog` (leva alguns minutos). Commit: `catalogo: script e characters.json`.

### 10.7 Prompt 5: o jogo passa a ler o catálogo

```
Leia o PROJETO.md. O catálogo public/catalog/characters.json já existe (array de Character com rarity). Antes de editar, me mostre o trecho onde o App carrega os personagens (fetch na AniList + cache de 24h).

Edições:
1. Carregue primeiro `${import.meta.env.BASE_URL}catalog/characters.json`. Se der certo, use esse array como pool (já com rarity) e NÃO consulte a AniList nem use o cache de 24h.
2. Se o catálogo falhar (arquivo inexistente ou erro), use o fluxo atual como fallback, sem mudar nada nele.
3. Mantenha o estado de carregando/erro como está.
4. A aba Ranking e a aba Coleção passam a usar esse pool.

Não altere: pesos do sorteio por raridade, abertura de pack, temas nem a coleção salva. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Conferir: a Coleção mostra "X / total"; no F12 → aba Rede não há chamadas à AniList; abrir um pack funciona. Efeito esperado: chances por raridade iguais, mas o grupo de Comuns fica enorme. Commit: `jogo: carrega catalogo estatico`.

### 10.8 Prompt 6: save versionado (só depois de exportar o backup)

```
Leia o PROJETO.md. ATENÇÃO: não apague nem altere a chave antiga da coleção (é o seguro contra perda). Antes de editar, mostre src/storage/collectionStorage.ts inteiro e liste todos os campos de Character usados em src/ (para eu confirmar que o novo formato os cobre; se faltar algum, inclua no snapshot).

Mude SOMENTE src/storage/collectionStorage.ts. As assinaturas públicas ficam iguais: loadCollection(): Character[] e saveCollection(cards: Character[]): void.
1. Nova chave `animepull_collection_v2`, formato: { "version": 2, "savedAt": "<ISO>", "cards": { "<id>": { "count": 1, "obtainedAt": "<ISO>", "c": { id, name: {full, native}, image: {large}, favourites, rarity, media: { nodes: [primeiro nó do tipo ANIME, ou lista vazia] } } } } }.
2. loadCollection: se a chave v2 existir e for válida (version === 2), reconstrua o Character[] a partir dela. Se não existir, leia a chave ANTIGA, converta (count 1, obtainedAt = hoje), grave na chave nova e devolva as cartas. NUNCA apague a chave antiga.
3. saveCollection: grave sempre em v2, preservando count e obtainedAt dos ids que já estavam salvos.
4. Tudo em try/catch. Se a v2 estiver corrompida, caia para a chave antiga.

Não altere nenhum outro arquivo. Sem dependências novas. Ao terminar, rode `npm run build`. Se o mesmo erro persistir após 3 tentativas, pare e me explique.
```

Conferir: contador igual; no F12 → Application → Local Storage → `localhost` aparecem a chave antiga e a `animepull_collection_v2`; abrir um pack, recarregar e as cartas novas continuam. Commit: `storage: save v2 versionado`.

### 10.9 Ordem sugerida dos prompts
**ATENÇÃO (decidido em 18/11/2026):** segurar o prompt 10.8 (save v2) até o formato do save prever packs, moedas e horário do próximo pack (ver seção 3), para evitar uma segunda migração. Os prompts 10.1 a 10.7 não são afetados.

10.2 (grade) → 10.3 → 10.4 → 10.5 → 10.6 → 10.7 → 10.1 (backup, e **exportar o backup antes de**) 10.8. Observação: a IA indicou no fim que trocar `localStorage` por IndexedDB fica **fora** por ora (o carregamento vira assíncrono e pede um passo separado), assim como baixar e hospedar as imagens dos personagens.

---

## 11. Onde paramos e próximos passos

1. **Versos (Fase 1):** confirmar que os versos foram movidos para `public\versos\` (seção 7) e fazer o commit. Depois, o usuário precisa mandar o `src/themes/CardBack.tsx` (link do GitHub ou anexo: `https://github.com/fabriciogrando0-prog/animepull/blob/master/src/themes/CardBack.tsx`). Com ele, escrever **um** pedido curto: o verso de cada tema passa a vir do arquivo `verso-<id>.png`. O pedido ainda não foi escrito. Obs.: as artes de verso são PNG de cerca de 2 MB; a conversão para `.webp` ficou como etapa separada.
2. **Launcher:** testar `iniciar-jogo.bat` com dois cliques depois de religar o PC (sem abrir o VS Code antes) e fazer o commit. Confirmar a porta que o usuário usava antes e se a coleção continua aparecendo.
3. **Coleção:** rodar os prompts da seção 10 na ordem, testando e commitando cada um. Depois, tratar o `.exe` (Electron) por último.
4. **Seguir o roadmap:** Fase 2 (seleção manual de pack, removendo a troca automática de tema) e Fase 3 (cartas por pack) dependem das decisões em aberto da seção 3. Os prompts longos escritos no início para essas fases foram descartados; reescrever em formato curto depois de ver o código real.
5. Decidir o que fazer com o arquivo solto de nome quebrado na raiz do projeto.
6. Para o painel de slots da abertura, ainda não foi decidido se deve virar uma linha de slots menores (hoje é grade de 2 colunas, com slot vazio mostrando o `CardBack`); a IA sugeriu que o slot vazio vai se resolver sozinho quando o verso entrar.
7. **Design system e economia do jogo:** salvar `DESIGN_SYSTEM.md`, responder a pergunta do contador de packs (único ou por tipo), definir os valores pendentes (tempo X do timer, limite de acúmulo, moedas por pack, preços da Loja) e enviar `App.tsx`, `AppShell.tsx`, `PacksTab.tsx` e `style.css`. Depois: pedido do estado salvo (packs, moedas, horário) e os passos de design em pedidos curtos.
