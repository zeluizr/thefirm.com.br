import type { Transition, Variants } from 'framer-motion'

// expo-out: arranca rápido, asienta lento — la curva de los reveals
export const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

// pop táctil y un poco mecánico — hace eco de las sombras duras desplazadas
export const springSnap: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 30,
  mass: 0.6,
}

// entrada estándar para títulos, tarjetas y bloques
export const easeOut: Transition = { duration: 0.55, ease: expoOut }

// dispara una sola vez, un poco antes de entrar del todo en viewport
export const inView = { once: true, margin: '0px 0px -12% 0px' } as const

export const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: easeOut },
}

// contenedor que escalona la entrada de sus hijos `reveal`
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
