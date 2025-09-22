import {
  FC,
  CSSProperties,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react'
import { useLayoutEffectDebounce } from 'sources/co/hooks'
import { EverscrollProps } from './types'

const Everscroll: FC<EverscrollProps> = ({
  children,
  total,
  fetcher,
  className,
  classNameGrid,
  renderIndex = 0,
  debounce = 100,
}) => {
  const viewRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [layoutIndex, setLayoutIndex] = useState(0)
  const incLayout = useCallback(() => setLayoutIndex(i => i + 1), [])
  const stateRef = useRef(initialState)

  const doLayout = useCallback(() => {
    const view = viewRef.current
    const grid = gridRef.current

    if (!view || !grid) {
      return
    }

    const s = stateRef.current
    const { clientWidth: W, clientHeight: H } = view

    s.W = W
    s.H = H

    if (!W || !H) {
      return
    }

    console.log('L>', stateRef.current)

    const itemsStats = () => {
      let [n, sArea, sW, sH] = [0, 0, 0, 0]

      Array.prototype.forEach.call(grid.children, (node) => {
        const { offsetWidth: w, offsetHeight: h } = node as HTMLElement

        if (w && h) {
          n++
          sArea += w * h
          sW += w
          sH += h
        }
      })

      return { n, sArea, sW, sH }
    }

    const approxWindow = (stats = itemsStats()) => {
      const { n, sArea } = stats
      return n ? Math.round(W * H * n / sArea) : 0
    }

    if (s.task === Task.WND) {
      s.task = Task.NIL

      const window = approxWindow()

      if (window > s.window) {
        fetcher?.(s.offset + s.window, window, 0)
        s.window = window
        incLayout()
      }

      return
    }

    const avgItem = (stats = itemsStats()) => {
      const { n, sW, sH } = stats
      const iW = sW / (n || 1)
      const iH = sH / (n || 1)

      return { iW, iH }
    }

    if (s.task === Task.IND) {
      s.task = Task.NIL

      const stats = itemsStats()
      const window = approxWindow(stats)
      const { iW, iH } = avgItem(stats)
      let inc = false

      if (window > s.window) {
        s.window = window
        inc = true
      }

      if (inc) {
        incLayout()
      }

      // console.log({ iW, iH, window })
    }

  }, [])

  const setGridNode = useCallback((grid: HTMLDivElement | null) => {
    gridRef.current = grid

    if (!grid) {
      return
    }

    // Nothing is rendered yet?
    if (grid.firstChild) {
      return
    }

    const s = stateRef.current

    // First render?
    if (s.task === Task.INI) {
      s.task = Task.WND
      incLayout()
    }
  }, [])

  useLayoutEffectDebounce(debounce, doLayout, [layoutIndex])

  useLayoutEffect(() => {
    const s = stateRef.current

    if (s.task === Task.NIL) {
      s.task = Task.IND
    }

    incLayout()
  }, [renderIndex])

  const topStyle: CSSProperties = useMemo(() => ({ height: 0 }), [])
  const bottomStyle: CSSProperties = useMemo(() => ({ height: 0 }), [])

  return (
    <div ref={viewRef} className={className}>
      <div style={topStyle} />
      <div ref={setGridNode} className={classNameGrid}>
        {renderRange(stateRef.current).map(i => children(i, layoutIndex))}
      </div>
      <div style={bottomStyle} />
    </div>
  )
}

enum Task {
  // Initial render:
  INI = 'initial',
  // Approximate the window:
  WND = 'window',
  IND = 'index',
  NIL = 'nil',
}

type State = {
  task: Task,
  offset: number,
  window: number,
  W: number,
  H: number,
}

const initialState: State = {
  task: Task.INI,
  offset: 0,
  window: 1,
  W: 0,
  H: 0,
}

const renderRange = (s: State): number[] => {
  if (s.window <= 0) {
    return []
  }

  const r = new Array(s.window)
  for (let i = 0; i < s.window; i++) {
    r[i] = s.offset + i
  }

  return r
}

export default Everscroll
