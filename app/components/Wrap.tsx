import type { ReactNode } from 'react'

export function Wrap({ children }: { children: ReactNode }) {
  return <div className='mx-auto max-w-295 px-6 bp:px-8'>{children}</div>
}
