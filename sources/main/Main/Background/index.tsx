import { VFC } from 'react'
import Gradient from './gradient'
import { Render } from 'sources/co/utils'
import styles from './styles.module.scss'

const Background: VFC = () => (
  <Render onReady={onSvgText}>
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={styles.background}
      viewBox="0 0 100 100"
    >
      <style></style>
      <defs>
        <Gradient id="gradient" />
      </defs>

      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.25"/>
      </filter>

      <circle
        transform="rotate(-45 50 50)"
        fill="url(#gradient)"
        filter="url(#blur)"
        cx="50"
        cy="50"
        r="71"
      />
    </svg>
  </Render>
);

const onSvgText = (root: HTMLDivElement) => {
  const svg = root.firstChild as SVGElement
  const svs = svg.firstChild as SVGStyleElement
  const css = window.getComputedStyle(svg)

  const vars = 'C 0 1'
    .split(' ')
    .map(x => `--gr${x}`)
    .map(p => [p, css.getPropertyValue(p)])
    .map(pv => pv.join(':'))
    .join(';')

  svs.innerHTML = `*{${vars};}`
  svg.classList.remove(...Array.from(svg.classList))

  const image = 'url(data:image/svg+xml;base64,'.concat(window.btoa(root.innerHTML),')')
  const style = document.createElement('style')

  style.innerHTML = '@layer global { '.concat(
    ':root body { background-image: ',
    'url(data:image/svg+xml;base64,',
    window.btoa(root.innerHTML),
    ');}',
  )

  document.head.appendChild(style)
}

export default Background
