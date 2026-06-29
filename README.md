# the firm

**Motor de contenido diario autogenerado para thefirm.com.br** (nombre en clave: _fagulha_).

Cada día genera un post de una categoría con Google Gemini —texto, imagen y, opcional, video—,
lo pasa por un doble filtro de moderación y lo deja en revisión. Nada se publica en el sitio
público sin un toque manual de aprobación por Telegram.

## Cómo funciona

```
cron diario → elige UNA categoría (la menos reciente)
  1. genera el texto (Gemini) con la blocklist como restricción
  2. modera: safety settings del modelo + clasificador Gemini
  3. genera la imagen lúdica (Nano Banana)
  4. si la categoría lo pide, genera el video (Veo, con polling)
  5. guarda el post como PENDING_REVIEW y avisa por Telegram
     con botones [Aprobar] [Rechazar] [Cambiar categoría]
  6. al tocar Aprobar → PUBLISHED → aparece en el sitio
```

La moderación automática es solo un prefiltro: la aprobación humana por Telegram es la válvula
real. El sitio público es de solo lectura y nunca expone posts no publicados.

## Stack

- **React Router v7** (framework mode, SSR)
- **TailwindCSS v4** CSS-first con tokens oklch, estética brutalista
- **Prisma** + **PostgreSQL**
- **Better Auth** (Google OAuth, allowlist de un único email para el admin)
- **grammY** (bot de Telegram, modo webhook)
- **Google Gemini** como proveedor único: texto, imagen, video y moderación
- **Railway** + **Docker** para el deploy

## Requisitos

- Node `>=22.13` y **pnpm 11**
- Una base PostgreSQL (`DATABASE_URL`)
- Credenciales de **Google OAuth** para el login del admin
- La clave de **Gemini** y el bot de **Telegram** se cargan después, desde el admin

## Configuración (dos niveles)

Los secretos están partidos en dos, por un motivo de seguridad: algunos se necesitan **antes**
de poder loguearte, así que no pueden vivir detrás del login.

- **Bootstrap (`.env`):** solo lo imprescindible para arrancar y loguear —
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CONFIG_ENCRYPTION_KEY`, las credenciales de Google OAuth
  y `ADMIN_EMAIL`. La página pública **`/setup`** muestra el estado de cada uno y cómo obtenerlo.
- **Operacional (admin, cifrado en la base):** la API key de Gemini, los tokens de Telegram,
  el `CRON_SECRET`, los IDs de modelo y el idioma se cargan y editan en **`/admin/settings`**,
  guardados cifrados (AES-256-GCM) con la `CONFIG_ENCRYPTION_KEY`.

```bash
openssl rand -base64 32   # → BETTER_AUTH_SECRET
openssl rand -hex 32      # → CONFIG_ENCRYPTION_KEY
```

## Instalación

```bash
git clone https://github.com/zeluizr/thefirm.com.br
cd thefirm.com.br
pnpm install
cp .env.example .env   # completá SOLO el bloque de bootstrap
pnpm db:migrate:dev    # crea el esquema en tu Postgres
pnpm db:seed           # carga las categorías iniciales
```

Después, entrá a `/admin/settings` y cargá Gemini, Telegram y el cron secret.

## Desarrollo

```bash
pnpm dev               # levanta el sitio + admin en http://localhost:3000
pnpm cron:dev          # dispara el pipeline una vez (genera un post)
pnpm db:studio         # inspecciona la base con Prisma Studio
```

El admin vive en `/admin` y solo deja entrar al email de `ADMIN_EMAIL`. Desde ahí podés
generar un post a mano, gestionar categorías, editar la blocklist y revisar los logs.

## Producción

```bash
pnpm build
pnpm start             # sirve ./build/server/index.js
```

En **Railway** (con el `Dockerfile` incluido):

- Web service: corre la migración y arranca el servidor (`pnpm db:migrate && pnpm start`).
  Montá un **Volume** en `MEDIA_DIR` para guardar las imágenes y videos generados.
- El **cron diario** dispara el pipeline llamando al endpoint protegido, para que la
  generación corra dentro del web service y escriba en su volumen:

  ```bash
  curl -X POST -H "x-cron-secret: $CRON_SECRET" "$APP_URL/api/cron/daily"
  ```

- Telegram en modo webhook apunta a `/api/webhooks/telegram` (con `TELEGRAM_WEBHOOK_SECRET`).

Todas las variables están documentadas en `.env.example`.

## Estructura

```
app/                  # React Router: sitio público + admin
  routes/             # home, post, login, admin/*, api/*
  components/         # UI brutalista + primitivos shadcn
  lib/                # utils, cliente de auth
server/               # lógica de servidor (fuera del bundle del cliente)
  lib/                # db, env, gemini, storage, auth, slug
  generator/          # generación de texto + prompt versionado
  moderation/         # doble filtro (safety + clasificador)
  media/              # imagen (Nano Banana) y video (Veo)
  telegram/           # bot, notify y formato de mensajes
  pipeline/           # orquestación diaria (1 post/día por LRU)
  cron/               # entrypoint del cron standalone
prisma/               # schema + seed
```

_Hecho con amor y café por [zeluizr](https://github.com/zeluizr) y con la ayuda de [Claude](https://claude.ai/referral/Cz_UimA0NQ) ☕_
