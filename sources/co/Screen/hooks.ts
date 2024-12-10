import { useState, useRef, useMemo, useEffect, useContext } from 'react'
import { throttle } from 'sources/lodash'
import { useListeners } from 'sources/co/hooks'
import { ScreenDimensionContext, ScreenSizeContext } from './context'
import {
  getScreenDimensionSize,
  getScreenOrientation,
  getScreenSize,
} from './utils'
import {
  ScreenDimension,
  ScreenDimensionListener,
  ScreenSize,
  ScreenSizeListener,
} from './types'

export const useScreenSize = () => useContext(ScreenSizeContext)

export const useScreenDimension = () => useContext(ScreenDimensionContext)

export const useScreenSizeImpl = (delay: number): ScreenSize => {
  const {
    addListener,
    removeListener,
    forEachListener,
  } = useListeners<ScreenSizeListener>()

  const [wh, setWh] = useState(getScreenSize())
  const whRef = useRef(wh)
  const [width, height] = wh

  useEffect(() => {
    forEachListener(listener => {
      listener(width, height)
    })
  }, [width, height, forEachListener])

  useEffect(() => {
    const setWhDebounce = throttle(
      (wC: number, hC:number ) => {
        const whC: [number, number] = [wC, hC]
        whRef.current = whC
        setWh(whC)
      },
      delay,
    )

    const onResize = () => {
      const [wC, hC] = getScreenSize()
      const [wR, hR] = whRef.current

      if (wR !== wC || hR !== hC) {
        setWhDebounce(wC, hC)
      }
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      setWhDebounce.cancel()
    }
  }, [])

  return useMemo(
    () => ({
      width,
      height,
      addListener,
      removeListener,
    }),
    [width, height, addListener, removeListener],
  )
}

export const useScreenDimensionImpl = (): ScreenDimension => {
  const {
    addListener,
    removeListener,
    forEachListener,
  } = useListeners<ScreenDimensionListener>()

  const [size, setSize] = useState(getScreenDimensionSize)
  const sizeRef = useRef(size)
  const [orientation, setOrientation] = useState(getScreenOrientation)
  const orientationRef = useRef(orientation)

  useEffect(() => {
    forEachListener(listener => {
      listener(size, orientation)
    })
  }, [size, orientation, forEachListener])

  useEffect(() => {
    const onResize = () => {
      const s = getScreenDimensionSize()

      if (s !== sizeRef.current) {
        sizeRef.current = s
        setSize(s)
      }
    }

    const onOrientation = () => {
      try {
        const o = getScreenOrientation()

        if (o !== orientationRef.current) {
          orientationRef.current = o
          setOrientation(o)
        }
      } catch {
      }
    }

    try {
      window.addEventListener('resize', onResize)
      screen.orientation.addEventListener('change', onOrientation)
    } catch {
    }

    return () => {
      try {
        window.removeEventListener('resize', onResize)
        screen.orientation.removeEventListener('change', onOrientation)
      } catch {
      }
    }
  }, [])

  return useMemo(
    () => ({
      size,
      orientation,
      addListener,
      removeListener,
    }),
    [size, orientation, addListener, removeListener],
  )
}
