import { FC } from 'react'
import { useRoutesSwitcher } from 'sources/co'
import Background from './Background'
import Content from './Content'
import Menu from './Menu'

const Main: FC = () => {
  const switcher = useRoutesSwitcher()

  return (
    <>
      <Background />
      <Content layout="menu content">
        <Menu />
        {switcher}
      </Content>
    </>
  )
}

export default Main
