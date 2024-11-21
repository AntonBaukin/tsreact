import { useEffect, useLayoutEffect, DependencyList, EffectCallback } from 'react'

/**
 * Calls the effect action with the specified delay (ms),
 * if none of the dependencies is changed.
 *
 * @param delay — constant timeout value (ms).
 * @param action — same as for useEffect() hook.
 * @param deps — dependencies of useEffect() hook.
 * @param enforced — enforces to work as useEffect().
 */
export const useEffectDebounce = (
  delay: number,
  action: EffectCallback,
  deps: DependencyList,
  enforced?: boolean,
) => {
  useEffect(makeEffector(delay, action, enforced), [enforced, ...deps])
}

export const useLayoutEffectDebounce = (
  delay: number,
  action: EffectCallback,
  deps: DependencyList,
  enforced?: boolean,
) => {
  useLayoutEffect(makeEffector(delay, action, enforced), [enforced, ...deps])
}

const makeEffector = (
  delay: number,
  action: EffectCallback,
  enforced: boolean | undefined,
) => () => {
  let destructor: ReturnType<typeof action> | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined

  if (enforced || delay <= 0) {
    destructor = action()
  } else {
    timeout = setTimeout(() => {
      destructor = action()
    }, delay)
  }

  return () => {
    timeout && clearTimeout(timeout)
    destructor?.()
  }
}
