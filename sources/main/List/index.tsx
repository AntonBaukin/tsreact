import { FC } from 'react'
import { Header } from 'sources/co/typo'
import { Text } from 'sources/co'
import Test from './temp/Test'

const List: FC = () => (
  <>
    <Header size="2">
      <Text>Main.title</Text>
    </Header>
    <Text name="fox">Main.content</Text>
    <Test />
  </>
)

export default List
