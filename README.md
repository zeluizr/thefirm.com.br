![the firm](.github/cover.png)

**thefirm.com.br — un documento sin permiso. Músico, skater, y de vuelta a la web por la escena.**

Landing y manifiesto de _The Firm_: una marca que arrancó hace veinte años en la escena del
skate paulista y vuelve a rodar entre São Paulo y Santiago. El **Lab** revive los trabajos
clásicos —la marca de skate, el cantor, los cracks del team— como prototipos en subdominios.

---

## Stack

- **React Router 7** — framework mode con SSR
- **Tailwind CSS 4** — tokens de diseño (morado → magenta) en `app/app.css`
- **Motion** (Framer Motion) — revelados en scroll y micro-interacciones
- **lucide-react** — íconos
- **TypeScript** + **Vite**

## Requisitos

- **Node.js 22.13+**
- **pnpm**

## Instalación

```bash
git clone https://github.com/zeluizr/thefirm.com.br.git
cd thefirm.com.br
pnpm install
```

## Desarrollo

```bash
pnpm dev
```

Levanta el sitio en `http://localhost:5173` con hot reload.

## Producción

```bash
pnpm build      # genera ./build
pnpm start      # sirve el build con SSR (react-router-serve)
```

Es una app SSR servida por Node, así que `pnpm start` la deja lista detrás del proxy o host
que prefieras.

## Estructura

```
app/
  root.tsx              layout, fuentes, error boundary
  routes/
    home.tsx            la página: hero, eras, lab, countdown
    manifiesto.tsx      el manifiesto — un documento sin permiso
  app.css               tokens de diseño (morado → magenta)
  lib/motion.ts         presets de animación
  components/           Hero · Eras · Lab · Ticker · Countdown · Spoiler · SectionHead · Eyebrow · Wrap · Footer
```

---

_Hecho con amor y café por [zeluizr](https://github.com/zeluizr) y con la ayuda de [Claude](https://claude.ai/referral/Cz_UimA0NQ) ☕_
