import { Link, redirect } from 'react-router'

import { bootstrapComplete } from '@server/lib/config'
import { getSession } from '@server/lib/session'
import { Button } from '~/components/ui/button'
import { signIn } from '~/lib/auth-client'
import type { Route } from './+types/login'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request)
  if (session) throw redirect('/admin')
  return { bootstrapOk: bootstrapComplete() }
}

export function meta(_: Route.MetaArgs) {
  return [{ title: 'login · the firm' }]
}

export default function Login({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="font-mono text-3xl font-bold tracking-tighter">
          the firm<span className="text-spark">.</span>
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          painel do admin
        </p>
      </div>

      {!loaderData.bootstrapOk && (
        <div className="w-full border-2 border-destructive bg-destructive/10 p-4 text-sm">
          <p className="font-bold">configuração de bootstrap incompleta</p>
          <p className="mt-1">
            O login Google pode não funcionar até preencher o env.{' '}
            <Link to="/setup" className="font-bold underline">
              abrir /setup →
            </Link>
          </p>
        </div>
      )}

      <div className="brut w-full p-6">
        <Button
          className="w-full"
          onClick={() => signIn.social({ provider: 'google', callbackURL: '/admin' })}
        >
          Entrar com Google
        </Button>
        <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
          acesso restrito a uma conta autorizada.
        </p>
      </div>
    </main>
  )
}
