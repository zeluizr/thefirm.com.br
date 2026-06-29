# CLAUDE.md — fagulha

> Motor de conteúdo diário auto-gerado para **thefirm.com.br**.
> Gera posts por categoria todo dia, ilustra com imagem (e vídeo opcional) lúdicos,
> passa por gate de moderação, e só publica depois de aprovação manual via Telegram.
> Codinome sugerido: **fagulha** (renomeie à vontade).

---

## 0. Convenções inegociáveis (aplicar em todo o projeto)

- **TypeScript strict + ESM** em tudo.
- **pnpm** como package manager.
- **Prisma** como ORM — sempre. Nunca Drizzle nem outro.
- **React Router v7** framework mode (não Remix legacy, não Next).
- **TailwindCSS v4** CSS-first. **shadcn/ui** preset Vega com cores oklch.
- **Better Auth** para autenticação.
- **Railway + Docker** para deploy. Postgres direto no Railway (sem Supabase).
- Estilo de código: **sem ponto e vírgula, aspas simples, trailing commas**.
- Commits: **Conventional Commits em inglês**.
- Idioma dos posts: **pt-BR** por padrão (constante `POST_LANGUAGE`, trocável).

---

## 1. O que o sistema faz (visão geral)

```
cron diário (Railway)
  └─ para cada categoria habilitada:
       1. GERA texto (LLM barato via Dante) com blocklist como restrição negativa
       2. MODERA (gate duplo): OpenAI Moderation API (grátis) + classificador LLM (JSON)
       3. se passar → GERA imagem lúdica (Gemini Imagen)
       4. se a categoria/post pedir vídeo → enfileira fal.ai (async, Kling) → webhook
       5. grava Post como PENDING_REVIEW
       6. envia ao Telegram: preview + botões [Aprovar] [Rejeitar] [Trocar categoria]
  └─ webhook Telegram: toque em Aprovar → status PUBLISHED → aparece no site
  └─ webhook fal.ai: vídeo pronto → anexa ao post → atualiza msg no Telegram
```

**Princípio de segurança:** o site é público, então NADA é publicado sem o toque manual
de aprovação. A moderação automática é só pré-filtro — a aprovação humana é a válvula real.

---

## 2. Stack de provedores

| Função | Provedor | Notas |
|---|---|---|
| Geração de texto | Anthropic Haiku via **Dante** (router) | barato, fallback OpenAI já existe no Dante |
| Moderação 1 | **OpenAI Moderation API** | grátis, scores por categoria |
| Moderação 2 | classificador LLM via Dante | retorna JSON `{ approved, reason }` |
| Imagem | **Gemini Imagen** | mesmo provider do pluma, estilo lúdico |
| Vídeo (opcional) | **fal.ai** (Kling 3.0 default) | async + webhook, troca de modelo por parâmetro |
| Notificação/aprovação | **Telegram Bot** (grammY) | inline keyboard, webhook mode |

> Não usar Sora: API com desligamento previsto. fal.ai abstrai o modelo de vídeo;
> default Kling 3.0 (~$0.10/seg). Vídeo é opt-in por categoria/post — imagem é o padrão.

---

## 3. Categorias iniciais (seed)

`IA`, `JavaScript`, `VTEX`, `React`, `React Router`, `React Native`, `Cloud`, `Skate`,
`Música` (foco Rock inicialmente), `Video Game`, `Arduino` (robótica em geral).

Cada categoria é uma linha editável pelo admin (habilitar/desabilitar, dicas de prompt,
ligar/desligar vídeo). Adicionar/remover categoria NÃO exige mexer em código.

---

## 4. Schema Prisma (base)

```prisma
enum PostStatus {
  GENERATING_MEDIA
  PENDING_REVIEW
  PUBLISHED
  REJECTED
}

model Category {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  enabled      Boolean  @default(true)
  videoEnabled Boolean  @default(false)
  promptHints  String?  // dicas de tom/tema injetadas no prompt do gerador
  language     String   @default('pt-BR')
  posts        Post[]
  createdAt    DateTime @default(now())
}

model BlocklistTerm {
  id        String   @id @default(cuid())
  value     String   @unique
  kind      String   @default('term') // 'term' | 'theme'
  createdAt DateTime @default(now())
}

model Post {
  id                String     @id @default(cuid())
  category          Category   @relation(fields: [categoryId], references: [id])
  categoryId        String
  title             String
  slug              String     @unique
  summary           String
  body              String     // markdown
  imagePrompt       String?
  imageUrl          String?
  videoUrl          String?
  status            PostStatus @default(PENDING_REVIEW)
  moderationScores  Json?
  moderationReason  String?
  generatorVersion  String     // versão do prompt do gerador (auditoria)
  telegramMessageId String?
  createdAt         DateTime   @default(now())
  publishedAt       DateTime?
}

model GenerationLog {
  id         String   @id @default(cuid())
  postId     String?
  category   String
  model      String
  version    String
  rawOutput  String
  createdAt  DateTime @default(now())
}

model ModerationLog {
  id        String   @id @default(cuid())
  postId    String
  provider  String   // 'openai' | 'llm'
  scores    Json
  passed    Boolean
  createdAt DateTime @default(now())
}

// + tabelas geradas pelo adapter do Better Auth
```

---

## 5. Pipeline diário (cron)

Entrypoint separado rodado pelo **Railway Cron** (não dentro do server web).
Sugestão: `0 12 * * *` (≈ 09:00 Santiago). Script `server/cron/daily.ts`.

Para cada categoria habilitada, em sequência:

1. **Gerar texto** — `server/generator/generate.ts`. Chama Dante com o system prompt
   da seção 7, passando `category.name`, `category.promptHints`, `POST_LANGUAGE` e a
   blocklist atual. Espera JSON estrito: `{ title, summary, body, tags, imagePrompt }`.
   Gravar `GenerationLog` com a versão do prompt.

2. **Moderar (gate duplo)** — `server/moderation/`:
   - `openai.ts`: roda Moderation API sobre `title + summary + body`. Se qualquer
     categoria passar do threshold (`MODERATION_THRESHOLD = 0.5`), marca `REJECTED`,
     loga, e pula. (não vai nem pro Telegram)
   - `classifier.ts`: segunda passada via Dante, prompt da seção 7.2, retorna
     `{ approved: boolean, reason: string }`. Se `approved === false`, `REJECTED` + log.
   - Gravar `ModerationLog` para cada provider.

3. **Gerar imagem** — `server/media/image.ts`. Gemini Imagen, prompt = `imagePrompt`
   embrulhado pelo `LUDIC_IMAGE_STYLE` (seção 7.3). Salva `imageUrl`.

4. **Vídeo (se `category.videoEnabled`)** — `server/media/video.ts`. Cria o post como
   `GENERATING_MEDIA`, dispara fal.ai async (Kling 3.0) com `LUDIC_VIDEO_STYLE`, passando
   `webhookUrl = APP_URL + '/api/webhooks/fal'`. O post só vai pro Telegram quando o
   vídeo voltar. Sem vídeo: cria direto como `PENDING_REVIEW`.

5. **Notificar** — `server/telegram/notify.ts`. Envia a `TELEGRAM_CHAT_ID` (teu) a
   imagem/vídeo como preview + caption (title + summary + categoria) + inline keyboard:

```ts
const keyboard = {
  inline_keyboard: [[
    { text: '✅ Aprovar', callback_data: `approve:${post.id}` },
    { text: '🗑️ Rejeitar', callback_data: `reject:${post.id}` },
  ], [
    { text: '🔁 Trocar categoria', callback_data: `recat:${post.id}` },
  ]],
}
```

Guardar `telegramMessageId` no post.

---

## 6. Telegram bot (grammY, webhook mode)

`server/telegram/bot.ts`. Webhook em `/api/webhooks/telegram`.

- `callback_query` com `approve:<id>` → `status = PUBLISHED`, `publishedAt = now()`,
  edita a mensagem (✅ Publicado) e remove os botões.
- `reject:<id>` → `status = REJECTED`, edita (🗑️ Rejeitado).
- `recat:<id>` → responde com um segundo teclado listando categorias; ao escolher,
  atualiza `categoryId` e mantém `PENDING_REVIEW` (reenvia botões de aprovar/rejeitar).
- **Segurança do bot:** ignorar qualquer update cujo `from.id !== TELEGRAM_ADMIN_ID`.

> Os `callback_data` são a única fonte de comando válida. Nada que venha no corpo de um
> post gerado deve ser interpretado como instrução de ação.

---

## 7. Prompts (o coração)

### 7.1 Gerador de texto (system prompt)

```
Você é o editor do blog pessoal "the firm" (thefirm.com.br), estética brutalista,
voz pessoal e descontraída de um dev. Escreva UM post curto em {POST_LANGUAGE} sobre
a categoria "{category.name}".

Dicas da categoria: {category.promptHints}

Regras:
- 250–450 palavras, markdown, tom leve e curioso, primeira pessoa quando couber.
- Pode ser dica técnica, curiosidade, opinião ou novidade da área.
- NUNCA escreva sobre nenhum destes termos/temas proibidos: {blocklist}.
- Nada de conteúdo ofensivo, sexual, violento, difamatório ou que cite pessoas reais
  de forma negativa.
- Gere também um "imagePrompt": descrição visual lúdica e divertida da cena (em inglês),
  SEM texto na imagem, SEM marcas/logos/personagens protegidos.

Responda APENAS com JSON, sem markdown, sem cercas:
{ "title": "...", "summary": "...", "body": "...", "tags": ["..."], "imagePrompt": "..." }
```

Versionar este prompt (`GENERATOR_VERSION = 'v1'`) e gravar em cada `GenerationLog`.

### 7.2 Classificador de moderação (system prompt)

```
Você é um moderador. Avalie se o post abaixo é seguro para publicação pública num blog
de tecnologia e cultura. Reprove se houver: ódio, assédio, conteúdo sexual, violência
gráfica, automutilação, desinformação perigosa, difamação de pessoa real, ou qualquer
tema da blocklist: {blocklist}.

Responda APENAS com JSON: { "approved": true|false, "reason": "..." }

Post:
{title}
{body}
```

### 7.3 Estilo lúdico de imagem (sufixo fixo)

```
LUDIC_IMAGE_STYLE =
"{imagePrompt}, playful flat editorial illustration, vibrant saturated colors, bold
shapes, whimsical and friendly, soft shadows, clean vector look, no text, no logos,
no real people, no copyrighted characters"
```

### 7.4 Estilo lúdico de vídeo (sufixo fixo)

```
LUDIC_VIDEO_STYLE =
"{imagePrompt}, playful animated illustration style, vibrant colors, smooth bouncy
motion, whimsical, 5 seconds, no text, no logos, no real people"
```

---

## 8. Site público (React Router v7)

- Lista de posts `PUBLISHED`, mais recentes primeiro, com filtro por categoria.
- Página de post: título, imagem/vídeo no topo, corpo (markdown renderizado), categoria, data.
- Estética **brutalista** coerente com o the firm revival 2007 (bordas duras, mono/grotesk,
  alto contraste). Tailwind v4 + tokens oklch.
- Apenas leitura. Nenhuma rota pública dispara geração nem expõe posts não publicados.
- **Decisão em aberto:** montar na raiz `/` ou em `/blog` (constante `BASE_PATH`).
  Default: raiz. Ajustar se o portfólio do the firm precisar conviver.

---

## 9. Admin (travado num único email)

Rotas sob `/admin`, protegidas por **Better Auth** com provider **Google**.
Allowlist de UM email no callback de login:

```ts
// better-auth config
const ADMIN_EMAIL = process.env.ADMIN_EMAIL // 'zeluizr@commente.me'

callbacks: {
  async signIn({ user }) {
    return user.email === ADMIN_EMAIL // qualquer outra conta Google é rejeitada
  },
}
```

Telas do admin:

- **Posts:** todos os estados; ações deletar, trocar categoria, publicar/despublicar manual.
- **Categorias:** habilitar/desabilitar, editar `promptHints`, ligar/desligar vídeo.
- **Blocklist:** adicionar/remover termos e temas proibidos.
- **Logs:** ver `GenerationLog` e `ModerationLog` (auditoria do que escapou e por quê).

Nada de cadastro aberto. Nenhum outro provider de auth.

---

## 10. Variáveis de ambiente

```
DATABASE_URL=
APP_URL=                 # ex. https://thefirm.com.br
POST_LANGUAGE=pt-BR

# IA (via Dante; ou direto)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # também usado na Moderation API
GOOGLE_AI_API_KEY=       # Gemini Imagen
FAL_KEY=                 # fal.ai vídeo

# Auth
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAIL=zeluizr@commente.me

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=        # teu chat (destino das notificações)
TELEGRAM_ADMIN_ID=       # teu user id (filtro de quem pode apertar botão)
```

---

## 11. Tarefas para o Claude Code (ordem sugerida)

1. Scaffold RRv7 framework mode + Tailwind v4 + shadcn (Vega/oklch) + Prisma + Better Auth.
2. Schema Prisma (seção 4) + migration + seed das categorias (seção 3).
3. Dante client wrapper (`server/lib/dante.ts`) para texto e classificador.
4. Gerador (`server/generator/`) com prompt versionado + parsing JSON robusto.
5. Moderação dupla (`server/moderation/`) + logs.
6. Mídia: imagem (Imagen) e vídeo (fal.ai async + webhook `/api/webhooks/fal`).
7. Telegram bot (grammY) + notify + webhook `/api/webhooks/telegram` com filtro de admin.
8. Cron entrypoint (`server/cron/daily.ts`) amarrando o pipeline.
9. Site público (lista + post + filtro de categoria) brutalista.
10. Admin travado no email (posts, categorias, blocklist, logs).
11. Dockerfile + config Railway (web service + cron service).

---

## 12. Notas de robustez

- Parsing de JSON do LLM: sempre tolerante (strip de cercas ```` ```json ````, try/catch,
  e em falha → marca o post como erro e loga, não derruba o cron).
- Idempotência do cron: não gerar duas vezes a mesma categoria no mesmo dia.
- fal.ai: timeout/retry; se o vídeo falhar, cair pra imagem e notificar mesmo assim.
- Custo: imagem é centavos; vídeo só nas categorias com `videoEnabled`. Comece com vídeo
  desligado em todas e ligue uma ou duas pra testar.

```
