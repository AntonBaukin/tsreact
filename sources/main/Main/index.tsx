import { VFC } from 'react'
import Icon from "sources/co/Icon";
import { useScreenSize } from 'sources/co/Screen'

const Main: VFC = () => {
  const { width, height } = useScreenSize()

  console.log('SIZE', { width, height })

  return (
    <>
      <h2>Sample application!</h2>
      <p>The quick brown fox jumps over the lazy dog <Icon name="search" /></p>
    </>
  )
}

export default Main
