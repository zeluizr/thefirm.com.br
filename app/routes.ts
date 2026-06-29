import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  // site público (somente leitura)
  index('routes/home.tsx'),
  route('post/:slug', 'routes/post.tsx'),

  // auth (Better Auth) + login + setup (bootstrap pré-login)
  route('login', 'routes/login.tsx'),
  route('setup', 'routes/setup.tsx'),
  route('api/auth/*', 'routes/api.auth.$.tsx'),

  // mídia gerada (servida a partir de MEDIA_DIR)
  route('uploads/*', 'routes/uploads.$.tsx'),

  // webhooks + cron HTTP
  route('api/webhooks/telegram', 'routes/api.webhooks.telegram.tsx'),
  route('api/cron/daily', 'routes/api.cron.daily.tsx'),

  // admin travado no email
  route('admin', 'routes/admin/layout.tsx', [
    index('routes/admin/index.tsx'),
    route('posts', 'routes/admin/posts.tsx'),
    route('posts/:id', 'routes/admin/post.tsx'),
    route('categories', 'routes/admin/categories.tsx'),
    route('blocklist', 'routes/admin/blocklist.tsx'),
    route('logs', 'routes/admin/logs.tsx'),
    route('settings', 'routes/admin/settings.tsx'),
  ]),
] satisfies RouteConfig
