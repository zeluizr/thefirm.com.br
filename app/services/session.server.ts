import { createCookieSessionStorage } from 'react-router'

import { env } from './env.server'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__firm_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [env.SESSION_SECRET],
    secure: env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
})

export function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'))
}
