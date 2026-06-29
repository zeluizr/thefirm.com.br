import { Form, redirect, useNavigation, useSearchParams } from 'react-router'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { createUserSession, getUserEmail, verifyLogin } from '~/services/auth.server'

import type { Route } from './+types/admin.login'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'the firm — acesso' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await getUserEmail(request)) throw redirect('/admin')
  return null
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  const next = String(form.get('next') ?? '/admin')

  if (await verifyLogin(email, password)) {
    const dest = next.startsWith('/admin') ? next : '/admin'
    return createUserSession(email, dest)
  }
  return { error: 'Credenciais inválidas.' }
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
  const [params] = useSearchParams()
  const navigation = useNavigation()
  const busy = navigation.state !== 'idle'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="font-mono text-[11px] uppercase tracking-[3px] text-primary">
            the firm · social publisher
          </span>
          <CardTitle className="mt-2 font-display text-2xl uppercase tracking-tight">
            Acesso privado
          </CardTitle>
          <CardDescription>Entre com as credenciais de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid gap-4">
            <input type="hidden" name="next" value={params.get('next') ?? '/admin'} />
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="username" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {actionData?.error ? (
              <p className="text-sm text-destructive">{actionData.error}</p>
            ) : null}
            <Button type="submit" disabled={busy} className="mt-2">
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
