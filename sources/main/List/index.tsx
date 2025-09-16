import { FC, useEffect } from 'react'
import { Header } from 'sources/co/typo'
import { Text } from 'sources/co'
import Test from './temp/Test'
import { listPageInit } from 'sources/main/List/units'

const List: FC = () => {
  // TODO Action list.PageInit is before app.Init and app.RouteChanged
  useEffect(() => listPageInit.dispatchIt(), [])

  return (
    <>
      <Header size="2">
        <Text>Main.title</Text>
      </Header>
      <Text name="fox">Main.content</Text>
      <Test />
    </>
  )
}

export default List
