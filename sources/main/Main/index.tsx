import { VFC } from 'react'
import Icon from 'sources/co/Icon'
import Header from 'sources/co/typo/Header'

const Main: VFC = () => {
  return (
    <>
      <Header size="2">Sample application!</Header>
      <div>The quick brown fox jumps over the lazy dog <Icon name="search" /></div>
    </>
  )
}

export default Main
