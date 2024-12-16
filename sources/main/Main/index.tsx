import { FC } from 'react'
import { Text } from 'sources/co'
import { Header } from 'sources/co/typo'
import Background from './Background'
import Content from './Content'
import Menu from './Menu'

const Main: FC = () => (
  <>
    <Background />
    <Content layout="menu content">
      <Menu />
      <div>
        <Header size="2">
          <Text>Main.title</Text>
        </Header>
        <Text name="fox">Main.content</Text>
      </div>
    </Content>
  </>
)

export default Main
