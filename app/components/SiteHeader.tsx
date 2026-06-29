import { Link } from 'react-router'

export function SiteHeader() {
  return (
    <header className="border-b-2 border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-mono text-2xl font-bold tracking-tighter">
          the firm
          <span className="text-spark">.</span>
        </Link>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          diário auto-gerado
        </span>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span>thefirm.com.br</span>
        <span>est. 2007 · revival</span>
      </div>
    </footer>
  )
}
