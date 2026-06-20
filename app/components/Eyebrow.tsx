import type { ReactNode } from 'react'

type EyebrowProps = {
  children: ReactNode
}

export function Eyebrow({ children }: EyebrowProps) {
  return (
    <span className='font-mono text-[13px] uppercase tracking-[3px] text-bone'>
      {children}
    </span>
  )
}
