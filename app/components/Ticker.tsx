import { Fragment } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Asterisk } from 'lucide-react'

const phrases = ['still rolling', 'the firm', '2007 → 2027', 'veinte años rodando']

function TickerSet({ keyPrefix }: { keyPrefix: string }) {
  return (
    <>
      {phrases.map((phrase, i) => (
        <Fragment key={`${keyPrefix}-${i}`}>
          <span className='px-[24px]'>{phrase}</span>
          <Asterisk
            className='shrink-0 text-magenta'
            size={18}
            strokeWidth={3}
            aria-hidden='true'
          />
        </Fragment>
      ))}
    </>
  )
}

export function Ticker() {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className='mt-[30px] overflow-hidden border-y-[3px] border-bone bg-bone py-3 text-void'
      aria-hidden='true'
    >
      <motion.div
        className='inline-flex items-center whitespace-nowrap font-display text-[19px] uppercase tracking-[1px]'
        animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 22, repeat: Infinity, ease: 'linear' }
        }
      >
        <TickerSet keyPrefix='a' />
        <TickerSet keyPrefix='b' />
      </motion.div>
    </div>
  )
}
