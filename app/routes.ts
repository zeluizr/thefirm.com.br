import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('manifiesto', 'routes/manifiesto.tsx'),
] satisfies RouteConfig
