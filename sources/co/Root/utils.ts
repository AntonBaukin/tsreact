import { VFC, createContext, createElement, useContext } from 'react'
import { createRoot, Root } from 'react-dom/client'
import config from 'sources/config'

export const getReactDomNode = () =>
  document.body.querySelector(`.${config.webNodeName}`)

export const getReactDomNodeEx = () => {
  const reactNode = getReactDomNode()

  if (!reactNode) {
    throw Error(`React application root node #${config.webNodeName} is not found`)
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

  return raceDocumentLoader(bootLoader)
}

const raceDocumentLoader = (callback: () => void) => () => {
  const docPromise = new Promise<void>(resolve => {
    if (document.readyState === 'loading') {
      const onLoad = () => {
        document.removeEventListener('DOMContentLoaded', onLoad)
        resolve()
      }

      document.addEventListener('DOMContentLoaded', onLoad)
    } else {
      resolve()
    }
  })

  const fontsPromise = Promise.any([
    document.fonts.ready,
    new Promise<void>(resolve => setTimeout(resolve, 500)),
  ])

  Promise.all([docPromise, fontsPromise]).then(callback)
}


