![the firm](.github/cover.png)

**The Firm Social Publisher — un estudio editorial privado para publicar imagen o video con leyenda en X, Instagram, Facebook Page y Threads, usando las APIs oficiales.**

No es un blog. No es un CMS. La unidad es **media + leyenda + plataformas + estado**, firmada por la persona _O Outro José_. El frontend público cuenta el concepto; el panel privado crea las piezas, sube la media, agenda y publica.

---

## Stack

- **React Router 7** — framework mode con SSR
- **TypeScript** + **Vite**
- **Tailwind CSS 4** — tokens (morado → magenta) en `app/app.css`
- **shadcn/ui** — todo el panel admin (Button, Input, Card, Table, Badge, Dialog, Dropdown, Tabs, Select, Switch, Toast…)
- **Motion** (Framer Motion) — el frontend público, con moderación
- **PostgreSQL** — vía `pg` y migraciones SQL planas
- **Railway Storage Bucket** (S3-compatible) — subida de media, con fallback a disco local en dev
- **Railway** — deploy + cron/worker para las publicaciones agendadas

## Áreas

- **Público** — `/` (fotolog de IA: hero com pilha de fotos recentes + mural de loucuras),
  `/manifiesto` (manifesto de O Outro José), `/about` (concepto), `/archive` (o arquivo completo).
- **Admin privado** — `/admin` (dashboard, lista, crear, subir, agendar, estado por plataforma, publicar ahora, dry-run, historial).

## Modelo

- **media_items** — `id, slug, title, caption, media_url, media_type (image|video), platforms[], publish_at, persona, status (draft|ready|scheduled|publishing|completed|failed), retain_media_after_publish, created_at, updated_at`.
- **platform_publications** — una fila por `(item, plataforma)`: `status (pending|publishing|published|failed|skipped), remote_post_id, permalink, error, attempts, published_at`.
- **publish_logs** — historial append-only para `/admin/logs` y la línea de tiempo de cada item.

## Flujo de publicación

1. El admin crea el item y sube la media (al bucket, o a `public/uploads` en dev).
2. El item queda `draft`.
3. Al marcarlo `ready` o al llegar `publish_at`, el worker lo procesa.
4. Para cada plataforma: si ya fue publicada, se ignora (idempotente, nunca duplica).
5. Se resuelve una URL accesible de la media cuando hace falta (signed URL para S3).
6. Se publica con el **adapter** de la plataforma.
7. Se guardan `remote_post_id` y `permalink`; si falla, se registra el `error`.
8. Cuando todas las plataformas terminan, el item queda `completed` (o `failed`).
9. Si `retain_media_after_publish = false`, la media se borra del bucket tras el éxito completo.

### Adapters

Uno por plataforma, todos exponen `publishMedia(input, { dryRun })`:

```
app/services/platforms/x.server.ts          OAuth 1.0a · upload + POST /2/tweets
app/services/platforms/instagram.server.ts  Graph API · container → publish
app/services/platforms/facebook.server.ts   Graph API · /photos | /videos
app/services/platforms/threads.server.ts    Threads API · container → publish
```

Reglas: APIs oficiales (sin Playwright/Selenium ni automatización de navegador), tokens nunca hardcodeados, sin duplicados. Si falta un token la plataforma se marca **skipped** con un error claro. Con `DRY_RUN=true` los adapters **simulan** (devuelven un resultado mock) sin tocar la red.

---

## Requisitos

- **Node.js 22.13+**
- **pnpm**
- **PostgreSQL** (local, Docker, o un Postgres de Railway)

## Instalación local

```bash
git clone https://github.com/zeluizr/thefirm.com.br.git
cd thefirm.com.br
pnpm install
cp .env.example .env
```

Un Postgres rápido con Docker:

```bash
docker run -d --name thefirm-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=thefirm \
  -p 5432:5432 postgres:16-alpine
```

Editá `.env` con tu `DATABASE_URL` y generá el hash del admin:

```bash
pnpm run hash-password -- 'tu-contraseña'   # pegá el resultado en ADMIN_PASSWORD_HASH
```

Migrá, sembrá datos de ejemplo y levantá el dev server:

```bash
pnpm run migrate
pnpm run seed        # opcional — crea piezas de ejemplo
pnpm run dev
```

- Público: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin` (entrá con `ADMIN_EMAIL` + tu contraseña)

> Sin bucket configurado, la media se guarda en `public/uploads` (ignorado por git) y `DRY_RUN=true` simula las publicaciones — la app funciona de punta a punta sin ninguna credencial de red.

## Comandos

```bash
pnpm run dev            # dev server (Vite + SSR)
pnpm run build          # build de producción → ./build
pnpm run start          # sirve el build (react-router-serve)
pnpm run migrate        # aplica las migraciones de /migrations
pnpm run seed           # datos de ejemplo
pnpm run seed:fotolog   # posts placeholder para el fotolog de la home
pnpm run publish-due    # procesa los items pronto/agendados vencidos (worker)
pnpm run dry-run        # simula los vencidos sin persistir nada
pnpm run hash-password -- 'pass'   # bcrypt hash para ADMIN_PASSWORD_HASH
pnpm run typecheck      # tipos
```

## Variables de entorno

Ver `.env.example`. Resumen:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | conexión a PostgreSQL |
| `SESSION_SECRET` | firma de la cookie de sesión |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | login del admin (hash bcrypt) |
| `APP_URL` | URL pública (para armar URLs absolutas de media) |
| `CRON_SECRET` | protege `POST /api/cron/publish-due` (opcional) |
| `RAILWAY_BUCKET*` | bucket S3-compatible (endpoint, región, keys) |
| `X_*` | claves y tokens OAuth 1.0a de X |
| `META_*` / `FACEBOOK_PAGE_ID` / `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Graph API (IG + FB Page) |
| `THREADS_*` | token y user id de Threads |
| `DRY_RUN` | `true` simula; dejalo en `true` hasta tener tokens válidos |
| `DEFAULT_TIMEZONE` | zona horaria por defecto |

Endpoints de ops: `GET /health` (liveness + DB) y `POST /api/cron/publish-due`.

---

## Deploy en Railway

1. **Proyecto + Postgres**

   Creá un proyecto en Railway y agregá un plugin **PostgreSQL**. Railway expone `DATABASE_URL` (referenciala con `${{Postgres.DATABASE_URL}}`).

2. **Servicio de la app**

   Conectá este repo. `railway.json` ya define el build (Nixpacks) y el start: corre las migraciones y arranca el server, con healthcheck en `/health`:

   ```
   startCommand: pnpm run migrate && pnpm run start
   ```

   Railway usa pnpm automáticamente (campo `packageManager`).

3. **Storage Bucket**

   Agregá un **Storage Bucket** y cargá `RAILWAY_BUCKET`, `RAILWAY_BUCKET_ENDPOINT`, `RAILWAY_BUCKET_REGION`, `RAILWAY_BUCKET_ACCESS_KEY_ID`, `RAILWAY_BUCKET_SECRET_ACCESS_KEY`.

4. **Variables**

   Cargá las del cuadro de arriba. Mantené `DRY_RUN=true` hasta verificar los tokens de cada red; después poné `DRY_RUN=false`. Definí `APP_URL` con tu dominio final (`https://thefirm.com.br`).

5. **Cron / worker de publicaciones**

   El worker es el comando `pnpm run publish-due`. Dos formas de dispararlo:

   - **Railway Cron (recomendado):** creá un servicio cron (mismo repo) con schedule, por ejemplo `*/5 * * * *`, y start command `pnpm run publish-due`. Procesa todo lo vencido y termina.
   - **Cron HTTP:** pegale a `POST /api/cron/publish-due` (o `GET ...?secret=...`) con el header `x-cron-secret: $CRON_SECRET`.

## Dominio thefirm.com.br

1. En el servicio de la app: **Settings → Networking → Custom Domain**, agregá `thefirm.com.br` (y `www.thefirm.com.br` si querés).
2. Railway te da un destino **CNAME**. En tu DNS:
   - `www` → CNAME al destino de Railway.
   - Raíz `thefirm.com.br` → usá **ALIAS/ANAME** al destino de Railway, o el CNAME de raíz si tu proveedor lo soporta (Cloudflare: CNAME con _proxy_).
3. Esperá la verificación; Railway emite el TLS automáticamente.
4. Poné `APP_URL=https://thefirm.com.br` en las variables y redeploy.

---

_Hecho con amor y café por [zeluizr](https://github.com/zeluizr) y con la ayuda de [Claude](https://claude.ai/referral/Cz_UimA0NQ) ☕_
