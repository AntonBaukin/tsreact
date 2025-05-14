import { useRef, useCallback, useEffect } from 'react'
import { DataUnit, UnitListener } from 'sources/unit'

export const useListenDataUnit = <U extends DataUnit>(
  unit: U,
  listener: UnitListener<U>,
) => {
  const listenerRef = useRef(listener)
  listenerRef.current = listener

  const fixedListener = useCallback((u: DataUnit) => {
    listenerRef.current(u as U)
  }, [])

  useEffect(() => {
    const unsubscribe = unit.listen(fixedListener)

    return () => {
      unsubscribe()
    }
  }, [])
}
