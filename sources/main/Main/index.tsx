import { VFC } from 'react'
import { Icon, Text } from 'sources/co'
import { Header } from 'sources/co/typo'
import Background from './Background'
import Content from './Content'

const Main: VFC = () => (
  <>
    <Background />
    <Content layout="menu content">
      <Header size="2">
        <Text>Main.title</Text>
      </Header>
      <div>
        <Text name="fox">Main.content</Text>
        <Icon name="search" />
      </div>
    </Content>
  </>
)

export default Main
