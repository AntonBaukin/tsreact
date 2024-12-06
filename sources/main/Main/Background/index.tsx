import { VFC } from 'react'
import { Render } from 'sources/co/utils'
import Gradient from './gradient'
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
        <Gradient />
      </defs>
      <rect fill="url(#g)" x="0" y="0" width="100" height="100" />
    </svg>
  </Render>
);

const onSvgText = (root: HTMLDivElement) => {
  const svg = root.firstChild as SVGElement
  const svs = svg.firstChild as SVGStyleElement
  const css = window.getComputedStyle(svg)

  const vars = 'a b'
    .split(' ')
    .map(x => `--${x}`)
    .map(p => [p, css.getPropertyValue(p)])
    .map(pv => pv.join(':'))
    .join(';')

  svs.innerHTML = `*{${vars};}`
  svg.classList.remove(...Array.from(svg.classList))

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
