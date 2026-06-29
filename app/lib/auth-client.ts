import { createAuthClient } from 'better-auth/react'

// baseURL default = origem atual; suficiente pro login do admin
export const authClient = createAuthClient()

export const { signIn, signOut, useSession } = authClient
