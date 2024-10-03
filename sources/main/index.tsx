import { createRoot } from 'react-dom/client'
import config from 'sources/config'
import Main from './Main'

export default () => {
  const reactNode = document.body.querySelector(`#${config.reactRootId}`)

  if (!reactNode) {
    throw Error('React application root node is not found')
  }

  const reactRoot = createRoot(reactNode)

  document.addEventListener('DOMContentLoaded', () => {
    reactRoot.render(<Main />)
  })
}
