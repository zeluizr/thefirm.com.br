import bcrypt from 'bcryptjs'
import { redirect } from 'react-router'

import { env } from './env.server'
import { getSession, sessionStorage } from './session.server'

// Single-admin auth: credentials come from ADMIN_EMAIL + ADMIN_PASSWORD_HASH.
export async function verifyLogin(email: string, password: string): Promise<boolean> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) return false
  if (email.trim().toLowerCase() !== env.ADMIN_EMAIL.trim().toLowerCase()) return false
  try {
    return await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)
  } catch {
    return false
  }
}

export async function createUserSession(email: string, redirectTo: string) {
  const session = await sessionStorage.getSession()
  session.set('userEmail', email)
  return redirect(redirectTo, {
    headers: { 'Set-Cookie': await sessionStorage.commitSession(session) },
  })
}

export async function getUserEmail(request: Request): Promise<string | null> {
  const session = await getSession(request)
  const email = session.get('userEmail')
  return typeof email === 'string' ? email : null
}

// Throws a redirect to /admin/login when not authenticated.
export async function requireUser(request: Request): Promise<string> {
  const email = await getUserEmail(request)
  if (!email) {
    const next = new URL(request.url).pathname
    throw redirect(`/admin/login?next=${encodeURIComponent(next)}`)
  }
  return email
}

export async function logout(request: Request) {
  const session = await getSession(request)
  return redirect('/admin/login', {
    headers: { 'Set-Cookie': await sessionStorage.destroySession(session) },
  })
}
