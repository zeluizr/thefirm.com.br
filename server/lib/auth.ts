import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError } from 'better-auth/api'

import { db } from './db'
import { env } from './env'

// Better Auth — login só via Google e travado num único email (CLAUDE.md §9).
// O bloqueio é feito no hook de criação de usuário: qualquer conta != ADMIN_EMAIL
// é rejeitada antes de virar registro, então nem sessão é criada.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.APP_URL, env.BETTER_AUTH_URL].filter(Boolean),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (env.ADMIN_EMAIL && user.email !== env.ADMIN_EMAIL) {
            throw new APIError('FORBIDDEN', { message: 'conta não autorizada' })
          }
          return { data: user }
        },
      },
    },
  },
})
