import { useState, useCallback } from 'react'

export const useListeners = <L>() => {
  const [listeners] = useState<L[]>([]) // never changed

  const addListener = useCallback((listener: L) => {
    if (!listeners.includes(listener)) {
      listeners.push(listener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const removeListener = useCallback((listener: L) => {
    const index = listeners.indexOf(listener)

    if (index >= 0) {
      listeners.splice(index, 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const forEachListener = useCallback((callback: ((listener: L) => void)) => {
    listeners.forEach(callback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clear = useCallback(() => {
    listeners.splice(0, listeners.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { addListener, removeListener, forEachListener, clear }
}
