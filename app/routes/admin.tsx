import {
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  PlusCircle,
  ScrollText,
  Settings,
  UserRound,
} from 'lucide-react'
import { Form, Link, NavLink, Outlet } from 'react-router'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import { requireUser } from '~/services/auth.server'
import { env, isStorageConfigured } from '~/services/env.server'

import type { Route } from './+types/admin'

export async function loader({ request }: Route.LoaderArgs) {
  const email = await requireUser(request)
  return {
    email,
    dryRun: env.DRY_RUN,
    storageConfigured: isStorageConfigured(),
  }
}

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/media', label: 'Mídias', icon: ImageIcon, end: false },
  { to: '/admin/media/new', label: 'Nova mídia', icon: PlusCircle, end: false },
  { to: '/admin/logs', label: 'Logs', icon: ScrollText, end: false },
  { to: '/admin/settings', label: 'Configurações', icon: Settings, end: false },
]

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { email, dryRun, storageConfigured } = loaderData

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col bp:flex-row">
        {/* sidebar */}
        <aside className="shrink-0 border-b border-border bp:w-60 bp:border-b-0 bp:border-r">
          <div className="flex items-center justify-between p-5 bp:block">
            <div>
              <div className="font-display text-lg uppercase tracking-tight">the firm</div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground">
                social publisher
              </div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 bp:flex-col bp:overflow-visible bp:pb-0">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
            <div className="flex items-center gap-2">
              {dryRun ? (
                <Badge variant="warning" title="DRY_RUN está ativo — nada é publicado de verdade.">
                  DRY-RUN
                </Badge>
              ) : (
                <Badge variant="success">AO VIVO</Badge>
              )}
              {!storageConfigured ? (
                <Badge variant="muted" title="Bucket não configurado — usando armazenamento local.">
                  storage: local
                </Badge>
              ) : null}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserRound className="size-4" />
                  <span className="hidden font-mono text-xs bp:inline">{email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings">Configurações</Link>
                </DropdownMenuItem>
                <Form method="post" action="/admin/logout">
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full cursor-pointer text-destructive">
                      Sair
                    </button>
                  </DropdownMenuItem>
                </Form>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="min-w-0 flex-1 p-6">
            <Outlet />
          </main>

          <footer className="border-t border-border px-6 py-3 text-center font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground">
            <FileText className="mr-1 inline size-3 align-[-2px]" />
            the firm — estúdio editorial privado · O Outro José
          </footer>
        </div>
      </div>
    </div>
  )
}
