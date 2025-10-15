import React, { FC, useState, useEffect, useCallback } from 'react'
import { Header } from 'sources/co/typo'
import { Everscroll, Text } from 'sources/co'
import { Person } from 'sources/main/api/types'
import { useAccumulateData, useSelectDataRange } from 'sources/main/store/hooks'
import { menuUnit } from 'sources/main/Main/units'
import { fetchPersons, fetchPersonsAccum, listFetch, listDoFetch } from './units'
import styles from './styles.module.scss'

const List: FC = () => {
  const { isLoading, total } = useSelectDataRange(fetchPersons)
  const [renderIndex, setRenderIndex] = useState(0);

  const { renderAt, windowFetcher } = useAccumulateData(
    fetchPersonsAccum,
    (offset, limit) => listFetch.dispatchSelf({ offset, limit }),
    (p: Person) => <PersonItemMem key={p.uuid} person={p} />,
    { total, minLimit: listDoFetch.minLimit },
  )

  useEffect(() => {
    if (!isLoading) {
      setRenderIndex(i => i + 1)
    }
  }, [isLoading])

  const onScroll = useCallback((row: number) => {
    menuUnit.setCompact(row > 1)
  }, []);

  return (
    <>
      <Header size="2">
        <Text>Main.title</Text>
      </Header>

      <div className={styles.personsContainer}>
        <Everscroll
          total={total}
          fetcher={windowFetcher}
          renderIndex={renderIndex}
          className={styles.personsList}
          classNameGrid={styles.personsListGrid}
          classNameEnd={styles.personsListEnd}
          onScroll={onScroll}
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
