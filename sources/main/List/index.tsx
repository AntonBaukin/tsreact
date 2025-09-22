import React, { FC, useState, useEffect } from 'react'
import { Header } from 'sources/co/typo'
import { Everscroll, Text } from 'sources/co'
import { Person } from 'sources/main/api/types'
import { useAccumulateData, useSelectDataRange } from 'sources/main/store/hooks'
import { fetchPersons, listFetch } from './units'
import styles from './styles.module.scss'

const List: FC = () => {
  const slice = useSelectDataRange(fetchPersons)
  const [renderIndex, setRenderIndex] = useState(0);

  const { renderAt, windowFetcher } = useAccumulateData(
    slice,
    (offset: number) => listFetch.dispatchSelf({ offset }),
    (p: Person) => <PersonItemMem key={p.uuid} person={p} />,
  )

  useEffect(() => {
    if (!slice.isLoading) {
      setRenderIndex(i => i + 1)
    }
  }, [slice.isLoading])

  return (
    <>
      <Header size="2">
        <Text>Main.title</Text>
      </Header>

      <div className={styles.personsContainer}>
        <Everscroll
          total={slice.total}
          fetcher={windowFetcher}
          renderIndex={renderIndex}
          className={styles.personsList}
          classNameGrid={styles.personsListGrid}
        >
          {renderAt}
        </Everscroll>
      </div>
    </>
  )
}

interface PersonItemProps {
  person: Person,
}

const PersonItem: FC<PersonItemProps> = ({ person }) => {
  return (
    <div className={styles.personItem}>
      <div>{person.lastName}</div>
    </div>
  )
}

const PersonItemMem = React.memo(PersonItem)

export default List
