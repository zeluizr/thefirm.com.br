# CLAUDE.md — fagulha

> Motor de conteúdo diário autogerado para **thefirm.com.br**.
> Gera 1 post/dia por categoria (rotação LRU), ilustra, passa por moderação dupla
> e **só publica depois de aprovação manual** via Telegram ou admin.
> Provedor único: **Google Gemini** (texto, imagem, vídeo e moderação).
>
> Este arquivo descreve o sistema **como implementado**. Histórico em `CHANGELOG.md`.

---

## 0. Convenções inegociáveis

- **TypeScript strict + ESM**. **pnpm**. **Prisma** como ORM (nunca outro).
- **React Router v7** framework mode (não Remix, não Next). **TailwindCSS v4** CSS-first +
  **shadcn/ui** com cores **oklch**. **Better Auth** pra autenticação.
- **Railway + Docker** pra deploy. Postgres direto no Railway (sem Supabase).
- Estilo: **sem ponto e vírgula, aspas simples, trailing commas**, 2 espaços.
- Commits: **Conventional Commits em inglês**. Posts em **pt-BR** (`POST_LANGUAGE`).

---

## 1. Como funciona

```
cron diário (Railway Cron → POST /api/cron/daily, protegido por CRON_SECRET)
  └─ escolhe UMA categoria: habilitada, menos recente (lastPostedAt asc, nulls first)
  └─ idempotência: se já há post criado hoje, não gera de novo
       1. GERA texto (Gemini, JSON forçado) com a blocklist como restrição
       2. MODERA: gate 1 (safety da geração) + gate 2 (classificador Gemini)
       3. cria Post como GENERATING_MEDIA, set category.lastPostedAt = now()
       4. ILUSTRA (Nano Banana via generateContent → bytes inlineData)
       5. se category.videoEnabled → Veo + polling (inline, teto 5 min)
       6. status → PENDING_REVIEW e NOTIFICA no Telegram
  └─ aprovação: botão do Telegram OU /admin → status PUBLISHED → aparece no site
```

A geração roda **dentro do web service** (não num cron service à parte) porque a mídia é
gravada em disco e o Railway Volume não é compartilhado entre serviços. O Railway Cron só
dispara o endpoint HTTP.

---

## 2. Stack de provedores

| Função | Provedor | Notas |
|---|---|---|
| Texto + classificador | **Gemini** `gemini-flash-latest` | `generateContent`, `responseMimeType: application/json` |
| Imagem | **Gemini** `gemini-3.1-flash-image` (Nano Banana) | `generateContent`, bytes em `inlineData` (NÃO `generateImages`) |
| Vídeo (opt-in) | **Gemini** `veo-3.1-fast-generate-preview` | `generateVideos` + polling |
| Moderação | **Gemini** | gate 1 = `STRICT_SAFETY` em toda chamada; gate 2 = classificador JSON |
| Notificação/aprovação | **Telegram Bot** (grammY) | inline keyboard, webhook em prod / `bot:dev` (polling) no local |

> IDs de modelo mudam rápido — confirme em https://ai.google.dev/gemini-api/docs/models.
> São override-áveis por env/DB. Vídeo desligado em todas as categorias por padrão (Veo é o
> único item caro). Imagem ~US$0,04–0,05; texto frações de centavo.

---

## 3. Estrutura

```
app/                       # React Router: site público + admin
  routes/
    home.tsx, post.tsx     # site público (só PUBLISHED)
    login.tsx, setup.tsx   # login Google + bootstrap (pré-login)
    uploads.$.tsx          # serve a mídia de MEDIA_DIR
    api.auth.$.tsx         # Better Auth handler
    api.webhooks.telegram.tsx  # webhook do Telegram (prod)
    api.cron.daily.tsx     # dispara o pipeline (Railway Cron chama)
    admin/                 # layout + index(painel) + posts + post(:id) +
                           #   categories + blocklist + logs + settings
  components/ (ui shadcn, Markdown, SiteHeader)
  lib/ (utils, auth-client)
server/                    # lógica de servidor (fora do bundle do cliente)
  lib/  db, env, gemini, config(+spec), crypto, storage, slug, constants, json, auth, session
  generator/  generate.ts + prompt.ts
  moderation/ classifier.ts + prompt.ts + index.ts (gates + logs)
  media/      image.ts (Nano Banana) + video.ts (Veo)
  telegram/   bot.ts + notify.ts + format.ts + poll.ts (bot:dev)
  pipeline/   run.ts (orquestração diária / forçar agora)
  cron/       daily.ts (entrypoint standalone alternativo)
  queries.ts  (queries do site público)
prisma/  schema.prisma + migrations + seed.ts
```

Imports: dentro de `app/` use `~/*`; de `app/` pra `server/` use `@server/*`; dentro de
`server/` use caminhos relativos (o cron via tsx não depende de alias).

---

## 4. Config em dois níveis (importante)

Segredos partidos por necessidade de segurança (alguns são precisos **antes** do login):

- **Bootstrap (`.env`)**: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CONFIG_ENCRYPTION_KEY`,
  `GOOGLE_CLIENT_ID/SECRET`, `ADMIN_EMAIL`, `APP_URL` (auto-resolve via `RAILWAY_PUBLIC_DOMAIN`).
  Status/instruções na página pública **`/setup`**.
- **Operacional (banco, cifrado AES-256-GCM)**: `GEMINI_API_KEY`, tokens do Telegram,
  `CRON_SECRET`, IDs de modelo, `POST_LANGUAGE`. Editados em **`/admin/settings`**.

NÃO leia segredos operacionais de `process.env` direto — use `runtimeConfig()`
(`server/lib/config.ts`, banco decifrado > env, cache invalidado a cada escrita).
`GOOGLE_CLIENT_*` (login) é OAuth, **diferente** de `GEMINI_API_KEY` (API generativa).

---

## 5. Rodar localmente

```bash
docker run -d --name fagulha-pg -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass \
  -e POSTGRES_DB=fagulha -p 5434:5432 postgres:16-alpine     # 5432/5433 podem estar ocupadas
cp .env.example .env        # preencha só o bloco de bootstrap (openssl rand p/ os secrets)
pnpm install
pnpm exec prisma migrate dev && pnpm exec prisma db seed
pnpm dev                    # Vite em http://localhost:5173
pnpm bot:dev                # 2º terminal: long polling, pros botões do Telegram funcionarem
```

- Configure Gemini/Telegram em `/admin/settings` (não no `.env`).
- Gere um post na mão: admin **Painel → "forçar agora"**.
- **Telegram chat id** = id **numérico** do usuário (@userinfobot), nunca o @username nem o id
  do bot (prefixo do token); mande `/start` pro bot antes. Sem `bot:dev` os botões ficam inertes.

---

## 6. Deploy (Railway)

- **Web service** (Dockerfile): `pnpm db:migrate && pnpm start`. Monte um **Volume** em
  `MEDIA_DIR`. Variáveis de bootstrap no service.
- **Cron**: Railway Cron (`0 12 * * *` ≈ 09:00 Santiago) fazendo
  `curl -XPOST -H "x-cron-secret: $CRON_SECRET" $APP_URL/api/cron/daily`.
- **Telegram**: registre o webhook em `$APP_URL/api/webhooks/telegram` (com
  `TELEGRAM_WEBHOOK_SECRET`) — aí os botões funcionam sem `bot:dev`.

---

## 7. Prompts (o coração)

Versionados (`GENERATOR_VERSION`, `CLASSIFIER_VERSION` em `server/lib/constants.ts`) e gravados
em `GenerationLog`/`ModerationLog`.

- **Gerador** (`server/generator/prompt.ts`): editor do blog "the firm", brutalista, voz pessoal
  de dev. 250–450 palavras, markdown, respeita a blocklist, gera também um `imagePrompt` (em
  inglês, sem texto/marcas/personagens). Responde só JSON.
- **Classificador** (`server/moderation/prompt.ts`): reprova ódio/assédio/sexual/violência/
  automutilação/desinformação/difamação/blocklist. Responde `{ approved, reason }`.
- **Estilos lúdicos** (`server/lib/constants.ts`): `applyLudicImageStyle` / `applyLudicVideoStyle`
  embrulham o `imagePrompt` (flat editorial / animação lúdica, sem texto/logos/pessoas reais).

Parsing do JSON do LLM é tolerante (`server/lib/json.ts`): extrai o primeiro objeto `{...}`
balanceado, tolerando `}` extra e blocos de código no corpo.

---

## 8. Princípio de segurança

O site é público, então **nada é publicado sem o toque manual de aprovação**. A moderação
automática é só pré-filtro. Só o `callback_data` do Telegram (validado pelo admin id) ou as
ações do admin (Better Auth, 1 email) disparam mudança de status — nunca o conteúdo gerado.
