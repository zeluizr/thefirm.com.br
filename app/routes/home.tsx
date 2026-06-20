import { Countdown } from '~/components/Countdown'
import { Eras } from '~/components/Eras'
import { Footer } from '~/components/Footer'
import { Hero } from '~/components/Hero'
import { Lab } from '~/components/Lab'
import { Ticker } from '~/components/Ticker'

import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'the firm — reactivado' },
    {
      name: 'description',
      content:
        'thefirm.com.br — mi primer dominio, de vuelta a la vida. La historia, los sitios, el manifiesto. 2007 → 2027.',
    },
  ]
}

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <main>
        <Countdown />
        <Eras />
        <Lab />
      </main>
      <Footer />
    </>
  )
}
