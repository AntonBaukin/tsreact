import { FC, memo, ReactNode } from 'react'

const Gradient: FC = () => {
  const [a, b] = ['var(--a)', 'var(--b)']

  const r3 = (r: number) => r.toFixed(3)

  const lg = (...stops: Array<[number, string]>) => (
    <linearGradient
      id="g"
      x1="0"
      x2="0"
      y1="0"
      y2="100%"
      gradientUnits="userSpaceOnUse"
      gradientTransform="rotate(-45, 50, 50)"
    >
      {stops.map(([o, c]) => <stop key={o} offset={r3(o)} stopColor={c} />)}
    </linearGradient>
  )

  const rF = Math.random
  const rD = (a: number, b: number) => a + (b - a) * rF()
  const st = (o: number, c: string) => <stop offset={r3(o)} stopColor={c} />

  if(!CSS.supports('(background: color-mix(in oklch, black, white))')) {
    return lg([0, a], [1, b])
  }

  const cm = (p: number) => `color-mix(in oklch, ${a}, ${b} ${r3(p)}%)`
  const rC = (a: number, b: number) => cm(rD(a, b))

  const [c0, cM, c1] = [rC(0, 10), rC(90, 100), rC(40, 70)]
  const mO = rD(0.3, 0.7)

  return lg([0, c0], [mO, cM], [1, c1])
}

export default memo(Gradient)
