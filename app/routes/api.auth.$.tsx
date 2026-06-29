import { auth } from '@server/lib/auth'
import type { Route } from './+types/api.auth.$'

// Better Auth lida com todas as rotas /api/auth/* (callback OAuth, sessão, signout)
export async function loader({ request }: Route.LoaderArgs) {
  return auth.handler(request)
}

export async function action({ request }: Route.ActionArgs) {
  return auth.handler(request)
}
