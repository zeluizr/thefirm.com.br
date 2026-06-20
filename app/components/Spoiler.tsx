import { useState } from 'react'
import type { ReactNode } from 'react'

type SpoilerProps = {
  children: ReactNode
  /** extra classes, e.g. `spoiler--magenta spoiler--block` */
  className?: string
}

// texto tapado por una barra que se revela al pasar el mouse, enfocar o tocar.
// es un <button> de verdad: foco por teclado y toque en móvil lo destapan
export function Spoiler({ children, className = '' }: SpoilerProps) {
  const [open, setOpen] = useState(false)

  return (
    <button
      type='button'
      data-open={open}
      aria-label={open ? undefined : 'revelar spoiler'}
      onClick={() => setOpen((prev) => !prev)}
      className={`spoiler ${className}`.trim()}
    >
      {children}
    </button>
  )
}
