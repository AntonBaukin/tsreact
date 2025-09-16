import { FC } from 'react'
import { Header } from 'sources/co/typo'
import { useSelectDataRange } from 'sources/main/store/hooks'
import { Text } from 'sources/co'
import Test from './temp/Test'
import { listPageInit, fetchPersons } from './units'

const List: FC = () => {
  const { isLoading, total } = useSelectDataRange(fetchPersons)

  return (
    <>
      <Header size="2">
        <Text>Main.title</Text>
      </Header>

      <div>
        <Text name="fox">Main.content</Text>
      </div>

      {!isLoading && (
        <div>
          <Text total={total}>List.loaded</Text>
        </div>
      )}
      <Test />
    </>
  )
}

export default List
