# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.1.0] — 2026-06-29

Primeira versão do **fagulha**: motor de conteúdo diário autogerado para
thefirm.com.br. Provedor único Google Gemini, moderação dupla e aprovação manual
via Telegram. Validado de ponta a ponta em ambiente local.

### Adicionado

- **Scaffold** React Router v7 (SSR, future flags v8) + TailwindCSS v4 (oklch,
  brutalista) + shadcn primitivos + Prisma/Postgres + Better Auth.
- **Schema Prisma**: `Category` (com `lastPostedAt` pra rotação LRU), `Post`,
  `BlocklistTerm`, `GenerationLog`, `ModerationLog`, `Setting` (config cifrada) +
  tabelas do Better Auth. Migration inicial + seed de 11 categorias.
- **Pipeline diário** (`server/pipeline`): escolhe **1 categoria/dia** por LRU e
  roda gerar → moderar → ilustrar → (vídeo opcional) → notificar. Idempotente por
  dia, tolerante a erro.
- **Gemini** como provedor único (`server/lib/gemini.ts`): texto + classificador
  (`gemini-flash-latest`), imagem (Nano Banana, `gemini-3.1-flash-image`) e vídeo
  (Veo, `veo-3.1-fast-generate-preview`, com polling). `STRICT_SAFETY` em toda chamada.
- **Moderação dupla**: gate 1 (safety da geração) + gate 2 (classificador Gemini),
  com `ModerationLog` por provider.
- **Telegram** (grammY): preview com imagem + **corpo completo** + teclado inline
  (aprovar/rejeitar/trocar categoria), filtro por admin id, webhook em produção e
  **`pnpm bot:dev`** (long polling) pros botões no localhost.
- **Site público** brutalista: lista, post (markdown), filtro por categoria —
  somente posts `PUBLISHED`.
- **Admin** travado num único email (Google OAuth): painel, posts, **preview de
  post** (`/admin/posts/:id`) com aprovar/rejeitar/trocar/deletar e **reenviar pro
  Telegram**, categorias, blocklist, logs e **onboarding/config** (`/admin/settings`).
- **Config em dois níveis**: segredos de bootstrap no `.env`; chaves operacionais
  cifradas (AES-256-GCM) no banco e editáveis pelo admin. Página `/setup` guia o
  bootstrap.
- **Mídia**: salva em `MEDIA_DIR`, servida pela rota `/uploads/*`; ao Telegram vai
  como bytes (`InputFile`), funcionando em localhost e sem URL pública em produção.
- **Cron HTTP** (`POST /api/cron/daily`, protegido por `CRON_SECRET`): geração roda
  no web service, escrevendo a mídia no volume dele.
- **Deploy**: Dockerfile multi-stage + `railway.json`.

### Sincronização Telegram ↔ admin

- Aprovar/rejeitar/trocar categoria pelo admin **edita a mensagem** correspondente
  no Telegram (`✅ Publicado` / `🗑️ Rejeitado`, remove os botões).

### Corrigido

- Parser de JSON do LLM robusto: extrai o primeiro objeto `{...}` balanceado,
  tolerando `}` extra colado pelo modelo e blocos de código no corpo do post.
- `bot:dev` resiliente: `bot.catch` + descarte de updates pendentes, pra um toque
  velho/erro não derrubar o polling.
