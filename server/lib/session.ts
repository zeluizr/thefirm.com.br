import { redirect } from 'react-router'

import { auth } from './auth'
import { env } from './env'

export async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers })
}

// guarda das rotas /admin — só passa o ADMIN_EMAIL autenticado
export async function requireAdmin(request: Request) {
  const session = await getSession(request)
  if (!session || session.user.email !== env.ADMIN_EMAIL) {
    throw redirect('/login')
  }
  return session
}
