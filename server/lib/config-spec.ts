// registro dos settings OPERACIONAIS (editáveis pelo admin, cifrados no banco).
// segredos de bootstrap (auth, db, encryption key) NÃO ficam aqui — vão no /setup.

export type SettingGroup = 'Gemini' | 'Telegram' | 'Cron' | 'Geral'

export type SettingField = {
  key: string
  label: string
  group: SettingGroup
  secret: boolean
  required: boolean
  help: string
  links?: { label: string; url: string }[]
  placeholder?: string
  default?: string
  generate?: boolean // mostra botão "gerar valor aleatório"
}

export const SETTINGS_GROUPS: SettingGroup[] = ['Gemini', 'Telegram', 'Cron', 'Geral']

export const SETTINGS_SPEC: SettingField[] = [
  {
    key: 'GEMINI_API_KEY',
    label: 'Gemini API Key',
    group: 'Gemini',
    secret: true,
    required: true,
    help: 'Entre no Google AI Studio, clique em "Get API key" e crie uma chave. É a chave da API generativa — diferente do OAuth de login.',
    links: [{ label: 'AI Studio → API key', url: 'https://aistudio.google.com/app/apikey' }],
    placeholder: 'AIza...',
  },
  {
    key: 'GEMINI_TEXT_MODEL',
    label: 'Modelo de texto',
    group: 'Gemini',
    secret: false,
    required: false,
    help: 'Modelo para o post e o classificador. Confirme o ID atual na doc de modelos.',
    links: [{ label: 'Modelos Gemini', url: 'https://ai.google.dev/gemini-api/docs/models' }],
    default: 'gemini-flash-latest',
  },
  {
    key: 'GEMINI_IMAGE_MODEL',
    label: 'Modelo de imagem',
    group: 'Gemini',
    secret: false,
    required: false,
    help: 'Nano Banana. Imagem é gerada via generateContent (não generateImages).',
    default: 'gemini-3.1-flash-image',
  },
  {
    key: 'GEMINI_VIDEO_MODEL',
    label: 'Modelo de vídeo',
    group: 'Gemini',
    secret: false,
    required: false,
    help: 'Veo 3.1 (opcional). Só roda nas categorias com vídeo ligado.',
    default: 'veo-3.1-fast-generate-preview',
  },
  {
    key: 'TELEGRAM_BOT_TOKEN',
    label: 'Token do bot',
    group: 'Telegram',
    secret: true,
    required: true,
    help: 'Fale com o @BotFather no Telegram, mande /newbot, escolha nome e @, e copie o token.',
    links: [{ label: '@BotFather', url: 'https://t.me/BotFather' }],
    placeholder: '123456:ABC-DEF...',
  },
  {
    key: 'TELEGRAM_CHAT_ID',
    label: 'Chat ID (destino)',
    group: 'Telegram',
    secret: false,
    required: true,
    help: 'Onde as previews chegam. Mande qualquer mensagem ao @userinfobot pra ver seu id. Inicie uma conversa com o SEU bot antes (mande /start a ele).',
    links: [{ label: '@userinfobot', url: 'https://t.me/userinfobot' }],
  },
  {
    key: 'TELEGRAM_ADMIN_ID',
    label: 'Admin ID (quem aperta os botões)',
    group: 'Telegram',
    secret: false,
    required: false,
    help: 'Seu user id do Telegram. Só ele pode aprovar/rejeitar. Geralmente igual ao Chat ID.',
    links: [{ label: '@userinfobot', url: 'https://t.me/userinfobot' }],
  },
  {
    key: 'TELEGRAM_WEBHOOK_SECRET',
    label: 'Webhook secret',
    group: 'Telegram',
    secret: true,
    required: false,
    help: 'Defesa extra: o Telegram envia esse token no header de cada update. Gere um aleatório.',
    generate: true,
  },
  {
    key: 'CRON_SECRET',
    label: 'Cron secret',
    group: 'Cron',
    secret: true,
    required: true,
    help: 'Protege POST /api/cron/daily. O Railway Cron envia no header x-cron-secret. Gere um aleatório.',
    generate: true,
  },
  {
    key: 'POST_LANGUAGE',
    label: 'Idioma dos posts',
    group: 'Geral',
    secret: false,
    required: false,
    help: 'Idioma padrão da geração (cada categoria pode sobrescrever).',
    default: 'pt-BR',
  },
]

// bootstrap (pré-login) — só pra exibir status e instruções no /setup
export type BootstrapField = {
  key: string
  label: string
  help: string
  links?: { label: string; url: string }[]
}

export const BOOTSTRAP_SPEC: BootstrapField[] = [
  {
    key: 'DATABASE_URL',
    label: 'PostgreSQL',
    help: 'Crie um Postgres (Railway: New → Database → PostgreSQL) e copie a connection string.',
    links: [{ label: 'Railway', url: 'https://railway.app' }],
  },
  {
    key: 'APP_URL',
    label: 'URL pública do app',
    help: 'Ex.: https://thefirm.com.br . Usada em links de mídia e callbacks.',
  },
  {
    key: 'BETTER_AUTH_SECRET',
    label: 'Better Auth secret',
    help: 'Segredo de sessão. Gere com: openssl rand -base64 32',
  },
  {
    key: 'CONFIG_ENCRYPTION_KEY',
    label: 'Chave de criptografia dos settings',
    help: 'Cifra os segredos operacionais no banco. Gere com: openssl rand -hex 32 . Não perca: trocar invalida o que já foi salvo.',
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    label: 'Google OAuth Client ID',
    help: 'Google Cloud → APIs & Services → Credentials → OAuth client (Web). Redirect URI: <APP_URL>/api/auth/callback/google',
    links: [
      { label: 'Google Cloud Credentials', url: 'https://console.cloud.google.com/apis/credentials' },
    ],
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    label: 'Google OAuth Client Secret',
    help: 'Vem junto do Client ID, na mesma credencial OAuth.',
  },
  {
    key: 'ADMIN_EMAIL',
    label: 'Email do admin',
    help: 'O único Google que pode entrar no /admin. Qualquer outra conta é rejeitada.',
  },
]
