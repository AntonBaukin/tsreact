import { VFC } from 'react'
import { Icon, Text } from 'sources/co'
import { Header } from 'sources/co/typo'
import Background from './Background'

const Main: VFC = () => {
  return (
    <>
      <Background />
      <Header size="2">
        <Text>Main.title</Text>
      </Header>
      <div>
        <Text name="fox">Main.content</Text>
        <Icon name="search" />
      </div>
    </>
  )
}

export default Main
