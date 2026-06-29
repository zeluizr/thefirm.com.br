import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  // ── public ────────────────────────────────────────────────────────────────
  index('routes/home.tsx'),
  route('manifiesto', 'routes/manifiesto.tsx'),
  route('about', 'routes/about.tsx'),
  route('archive', 'routes/archive.tsx'),

  // ── ops ───────────────────────────────────────────────────────────────────
  route('health', 'routes/health.tsx'),
  route('api/cron/publish-due', 'routes/api.cron.publish-due.tsx'),

  // ── admin ─────────────────────────────────────────────────────────────────
  route('admin/login', 'routes/admin.login.tsx'),
  route('admin/logout', 'routes/admin.logout.tsx'),
  route('admin', 'routes/admin.tsx', [
    index('routes/admin._index.tsx'),
    route('media', 'routes/admin.media._index.tsx'),
    route('media/new', 'routes/admin.media.new.tsx'),
    route('media/:id', 'routes/admin.media.$id.tsx'),
    route('settings', 'routes/admin.settings.tsx'),
    route('logs', 'routes/admin.logs.tsx'),
  ]),
] satisfies RouteConfig
