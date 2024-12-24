import { FC, useEffect } from 'react'
import { RootProps } from './types'
import { useReactRootDomNode } from './utils'

export { makeReactBoot } from './utils'

const Root: FC<RootProps> = ({ children, className }) => {
  const rootNode = useReactRootDomNode()

  useEffect(() => {
    if (rootNode && className) {
      rootNode.classList.add(className)
    }

    return () => {
      if (rootNode && className) {
        rootNode.classList.remove(className)
      }
    }
  }, [rootNode, className])

  return (
    <>
      {children}
    </>
  )
}

export const withRootClass = (className: string | undefined, Component: FC) => {
  const RootComponent: FC = () => (
    <Root className={className}>
      <Component />
    </Root>
  )

  RootComponent.displayName = `Root_${Component.displayName ?? 'Component'}`

  return RootComponent
}

export const withRoot = (Component: FC) => withRootClass(undefined, Component)

export default Root
