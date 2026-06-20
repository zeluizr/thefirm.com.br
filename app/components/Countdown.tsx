import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Gift } from 'lucide-react'

import { expoOut, inView, reveal } from '~/lib/motion'

import { SectionHead } from './SectionHead'
import { Spoiler } from './Spoiler'
import { Wrap } from './Wrap'

// veinte años exactos desde el registro del dominio: 20/03/2007 → 20/03/2027,
// medianoche en São Paulo, donde todo empezó
const TARGET = new Date('2027-03-20T00:00:00-03:00').getTime()

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft | null {
  const diff = TARGET - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function Unit({ value, label }: { value: number | null; label: string }) {
  const display = value === null ? '··' : pad(value)

  return (
    <div className='flex flex-col items-center border-[3px] border-bone bg-void-2 px-3 py-6 shadow-hard bp:py-8'>
      {/* la cifra "cae" como un odómetro cada vez que cambia; el contenedor
          recorta el desborde para que el salto entre desde arriba */}
      <span className='block h-[clamp(40px,9vw,72px)] overflow-hidden font-display text-[clamp(40px,9vw,72px)] leading-none tracking-[-0.02em] text-bone tabular-nums'>
        <motion.span
          key={display}
          className='block'
          initial={{ y: '-45%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, ease: expoOut }}
        >
          {display}
        </motion.span>
      </span>
      <span className='mt-3 font-mono text-[12px] uppercase leading-none tracking-[2px] text-bone-dim'>
        {label}
      </span>
    </div>
  )
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [arrived, setArrived] = useState(false)

  // se calcula sólo en el cliente para no romper la hidratación (el server no
  // conoce la hora del visitante)
  useEffect(() => {
    function tick() {
      const next = getTimeLeft()
      if (next) {
        setTimeLeft(next)
      } else {
        setArrived(true)
      }
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { label: 'días', value: timeLeft?.days ?? null },
    { label: 'horas', value: timeLeft?.hours ?? null },
    { label: 'min', value: timeLeft?.minutes ?? null },
    { label: 'seg', value: timeLeft?.seconds ?? null },
  ]

  return (
    <section id='veinte' className='py-20 bp:py-30'>
      <Wrap>
        <SectionHead
          eyebrow='la cuenta regresiva'
          count='20·03·2027'
          title={
            <>
              rumbo a los
              <br />
              veinte años
            </>
          }
        />

        {arrived ? (
          <motion.div
            variants={reveal}
            initial='hidden'
            whileInView='show'
            viewport={inView}
            className='border-[3px] border-bone bg-magenta px-6 py-12 text-center font-display text-[clamp(32px,6vw,64px)] uppercase leading-[0.95] tracking-[-0.02em] text-void shadow-hard-purple'
          >
            veinte años rodando
          </motion.div>
        ) : (
          <motion.div
            variants={reveal}
            initial='hidden'
            whileInView='show'
            viewport={inView}
            className='grid grid-cols-2 gap-4 bp:grid-cols-4 bp:gap-6'
          >
            {units.map((unit) => (
              <Unit key={unit.label} value={unit.value} label={unit.label} />
            ))}
          </motion.div>
        )}

        <motion.div
          variants={reveal}
          initial='hidden'
          whileInView='show'
          viewport={inView}
          className='mt-6 flex items-start gap-4 border-[3px] border-bone bg-magenta p-6 text-void shadow-hard-purple bp:mt-8 bp:p-8'
        >
          <Gift
            className='mt-1 shrink-0'
            size={32}
            strokeWidth={2.5}
            aria-hidden='true'
          />
          <div>
            <h3 className='font-display text-[clamp(20px,3vw,28px)] uppercase leading-[1.05] tracking-[-0.01em]'>
              ese día, una sorpresa
            </h3>
            <p className='mt-2 max-w-150 font-medium leading-[1.5]'>
              El 20 de marzo de 2027, thefirm.com.br cumple veinte años. Ese día
              suelto <Spoiler>algo gratis para músicos y skaters</Spoiler> — sin
              vueltas.
            </p>
            <Link
              to='/manifiesto'
              className='mt-4 inline-flex items-center gap-2 border-2 border-void px-3.5 py-2 font-mono text-[13px] uppercase leading-none tracking-[1px] no-underline transition-colors duration-150 hover:bg-void hover:text-bone motion-reduce:transition-none'
            >
              leer el manifiesto →
            </Link>
          </div>
        </motion.div>
      </Wrap>
    </section>
  )
}
