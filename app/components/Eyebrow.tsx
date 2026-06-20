import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Zap } from 'lucide-react'

type EyebrowProps = {
  children: ReactNode
  variant?: 'purple' | 'magenta'
  icon?: LucideIcon
}

export function Eyebrow({
  children,
  variant = 'purple',
  icon: Icon = Zap,
}: EyebrowProps) {
  return (
    <span className='inline-flex items-center gap-[10px] font-mono text-[13px] uppercase tracking-[3px] text-bone'>
      <span
        className={`inline-flex h-[22px] w-[22px] items-center justify-center border-2 border-bone text-void ${
          variant === 'magenta' ? 'bg-magenta' : 'bg-purple'
        }`}
        aria-hidden='true'
      >
        <Icon size={13} strokeWidth={2.75} />
      </span>
      {children}
    </span>
  )
}
