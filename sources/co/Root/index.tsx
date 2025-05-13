import { FC, useEffect } from 'react'
import { nameHoc } from 'sources/co/utils/compose'
import { RootProps } from './types'
import { useReactRootDomNode } from './utils'

export { makeReactBoot, composeReactBoot } from './utils'

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

export const withRootClass = (className: string | undefined) => (Component: FC) =>
  nameHoc (
    'Root',
    Component,
    () => (
      <Root className={className}>
        <Component />
      </Root>
    ),
  )

export const withRoot = withRootClass(undefined)

export default Root
