import { FC, memo, Fragment } from 'react'

const Gradient: FC<{ id: string }> = ({ id }) => {
  const rF = Math.random
  const rN = (n: number) => Math.trunc(rF() * n)
  const r3 = (r: number) => String(Math.trunc(1000 * r) * 0.001).substring(0, 5)

  const nStops = 10 + rN(10)
  const offsets = Array.from({ length: nStops }).map(rF).sort()

  const color = (pc: number) => `color-mix(in var(--grC), var(--gr0), var(--gr1) ${pc}%)`
  const grX = () => rN(100) < 50 ? 'var(--gr0)' : 'var(--gr1)'

  const makeStop = (o: number, i: number) => (
    <Fragment key={`${i}-${o}`}>
      <stop offset={r3(o)} stop-color={color(rN(100))} />
      <stop offset={r3(o)} stop-color={grX()} />
    </Fragment>
  )

  return (
    <linearGradient id={id} x1='0' x2='0' y1='0' y2='100%' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stopColor='var(--gr0)'></stop>
      {offsets.map(makeStop)}
      <stop offset='1' stopColor='var(--gr1)'></stop>
    </linearGradient>
  );
}

Gradient.displayName='Gradient'

export default memo(Gradient)
