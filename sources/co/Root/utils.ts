import { VFC, createContext, createElement, useContext } from 'react'
import { createRoot, Root } from 'react-dom/client'
import config from 'sources/config'

export const getReactDomNode = () =>
  document.body.querySelector(`#${config.reactRootId}`)

export const getReactDomNodeEx = () => {
  const reactNode = getReactDomNode()

  if (!reactNode) {
    throw Error(`React application root node #${config.reactRootId} is not found`)
  }

  return reactNode
}

const ReactRootDomNodeContext = createContext<Element | null>(null)

export const useReactRootDomNode = () => useContext(ReactRootDomNodeContext)

export const makeReactBoot = (Component: VFC) => {
  let reactRoot: Root | null = null

  const bootLoader = () => {
    if (reactRoot) {
      throw Error('Attempt to re-create React application')
    }

    const reactNode = getReactDomNodeEx()
    reactRoot = createRoot(reactNode)

    const rootComponent = createElement(Component)
    reactRoot.render(rootComponent)
  }

  return () => {
    if (document.readyState === 'loading') {
      const onLoad = () => {
        document.removeEventListener('DOMContentLoaded', onLoad)
        bootLoader()
      }

      document.addEventListener('DOMContentLoaded', onLoad)
    } else {
      bootLoader()
    }
  }
}
