import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap',
  },
]

export const meta: Route.MetaFunction = () => [
  { title: 'the firm' },
  { name: 'description', content: 'motor de conteúdo diário — thefirm.com.br' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = 'erro'
  let message = 'algo quebrou.'
  if (isRouteErrorResponse(error)) {
    title = `${error.status}`
    message = error.statusText || message
  } else if (error instanceof Error && import.meta.env.DEV) {
    message = error.message
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="font-mono text-6xl font-bold">{title}</h1>
      <p className="border-2 border-border bg-card px-4 py-2 font-mono text-sm">
        {message}
      </p>
      <a href="/" className="font-bold uppercase tracking-wide underline">
        ← voltar
      </a>
    </main>
  )
}
