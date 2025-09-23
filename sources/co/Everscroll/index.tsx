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

    if (!W || !H) {
      return
    }

    const isSame = (a: number, b: number) => Math.abs(a - b) < 2

    // Viewport dimensions have changed?
    if (isSame(s.W, W) && isSame(s.H, H)) {
      if (s.task === Task.NIL) {
        return
      }
    } else {
      s.W = W
      s.H = H

      if (s.task === Task.NIL) {
        s.task = Task.INV
      }
    }

    console.log('R>', s)

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

    const avgItem = (stats = itemsStats()) => {
      const { n, sW, sH } = stats
      const iW = sW / (n || 1)
      const iH = sH / (n || 1)

      return { iW, iH }
    }

    if (s.task === Task.INV) {
      s.task = Task.NIL

      const stats = itemsStats()
      const window = approxWindow()

      // Viewport capacity became larger?
      if (window > s.window) {
        fetcher?.(s.offset + s.window, window, 0)
        s.window = window
        incLayout()
        return
      }

      // const { iW, iH } = avgItem(stats)
    }

  }, [])

  // console.log('S>', stateRef.current)

  // Processing initial state?
  if(stateRef.current.task === Task.INI) {
    const s = stateRef.current
    const grid = gridRef.current

    // Rendered just one item?
    if (grid?.firstChild && grid.firstChild === grid.lastChild) {
      s.task = Task.INV
    }
  }

  useLayoutEffectDebounce(debounce, doLayout, [layoutIndex])

  useLayoutEffect(() => {
    const s = stateRef.current

    if (s.task === Task.NIL) {
      s.task = Task.INV
    }

    incLayout()
  }, [renderIndex])

  const topStyle: CSSProperties = useMemo(() => ({ height: 0 }), [])
  const bottomStyle: CSSProperties = useMemo(() => ({ height: 0 }), [])

  return (
    <div ref={viewRef} className={className}>
      <div style={topStyle} />
      <div ref={gridRef} className={classNameGrid}>
        {renderRange(stateRef.current).map(i => children(i, layoutIndex))}
      </div>
      <div style={bottomStyle} />
    </div>
  )
}

enum Task {
  // Initial render of a single item:
  INI = 'initial',
  // Invalidate the layout, approximate the window:
  INV = 'invalidate',
  // Stale...
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
