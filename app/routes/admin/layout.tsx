import { NavLink, Outlet, useNavigate } from 'react-router'

import { requireAdmin } from '@server/lib/session'
import { Button } from '~/components/ui/button'
import { signOut } from '~/lib/auth-client'
import type { Route } from './+types/layout'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAdmin(request)
  return { email: session.user.email }
}

const NAV = [
  { to: '/admin', label: 'painel', end: true },
  { to: '/admin/posts', label: 'posts', end: false },
  { to: '/admin/categories', label: 'categorias', end: false },
  { to: '/admin/blocklist', label: 'blocklist', end: false },
  { to: '/admin/logs', label: 'logs', end: false },
  { to: '/admin/settings', label: 'config', end: false },
]

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-lg font-bold tracking-tighter">
              the firm<span className="text-spark">.</span>admin
            </span>
            <nav className="flex flex-wrap gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      isActive
                        ? 'border-border bg-primary text-primary-foreground'
                        : 'border-transparent hover:border-border'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              {loaderData.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
