import {
  FC,
  CSSProperties,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react'
import cn from 'classnames'
import { iRange } from 'sources/lodash'
import { useLayoutEffectDebounce } from 'sources/co/hooks'
import { EverscrollProps } from './types'

const Everscroll: FC<EverscrollProps> = ({
  children,
  total,
  fetcher,
  className,
  classNameGrid,
  classNameEnd,
  renderIndex = 0,
  debounce = 32,
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

    const isRowBreak = (node: HTMLElement) => {
      const prev = node.previousSibling as HTMLElement | null

      if (!prev) {
        return true
      }

      const { offsetTop: y0, offsetHeight: h0 } = prev
      const { offsetTop: y1 } = node

      return y1 >= y0 + h0
    }

    const itemsStats = () => {
      let [n, sArea, sH, sW, rows] = [0, 0, 0, 0, 0, 0]

      Array.prototype.forEach.call(grid.children, (child) => {
        const node = child as HTMLElement
        const { offsetWidth: w, offsetHeight: h } = node

        if (isRowBreak(node)) {
          rows++
        }

        if (w && h) {
          n++
          sArea += w * h
          sH += h
          sW += w
        }
      })

      const cols = rows ? Math.max(1, Math.ceil(n / rows)) : 1
      const window = sArea ? Math.ceil(W * H * n / sArea) : 0
      const iH = n ? sH / n : 0
      const iW = n ? sW / n : 0

      return { n, iH, iW, rows, cols, window }
    }

    if (s.task === Task.INV) {
      const stats = itemsStats()
      const { window, cols, iH, iW } = stats

      s.task = Task.NIL
      s.cols = cols
      s.iH = iH
      s.iW = iW

      // Viewport capacity became larger?
      if (window > s.window) {
        fetcher?.(s.offset + s.window, window, 0)
        s.window = window
      }
    }

    if (s.task === Task.SKR) {
      const { scrollTop } = view
      const { iH, cols, window } = s

      s.task = Task.NIL

      if (iH && cols) {
        const offsetRow = Math.floor(s.offset / cols)
        const scrollRow = Math.floor(scrollTop / iH)

        if (offsetRow !== scrollRow) {
          s.offset = scrollRow * cols
          fetcher?.(s.offset, window, 0)
        }
      }
    }
  }, [fetcher])

  const onScroll = useCallback(() => {
    const s = stateRef.current

    if (s.task === Task.NIL) {
      s.task = Task.SKR
      incLayout()
    }
  }, [])

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

  // Do not effect on total change:
  stateRef.current.total = total

  const bounds = renderBounds(stateRef.current)
  const indexesToDisplay = renderRange(stateRef.current, bounds)
  const isAllDisplayed = bounds[1] === total

  const [gridTop, totalHeight] = useMemo(() => {
    const [b, e] = bounds
    const { cols, iH } = stateRef.current
    const totalRows = Math.ceil(total / cols)
    const displayedRows = Math.ceil((e - b) / cols)
    const beginRow = Math.floor(b / cols)

    return [
      -(totalRows - displayedRows - beginRow) * iH,
      (totalRows - displayedRows) * iH,
    ]
  }, [
    ...bounds,
    stateRef.current.cols,
    stateRef.current.iH,
    total,
  ])

  const scrollHeightStyle: CSSProperties = useMemo(() => ({
    minHeight: `${totalHeight}px`,
    height: `${totalHeight}px`,
  }), [totalHeight])

  const gridStyle: CSSProperties = useMemo(() => ({
    position: 'relative',
    top: `${gridTop}px`,
  }), [gridTop])

  return (
    <div ref={viewRef} className={className} onScroll={onScroll}>
      <div style={scrollHeightStyle} />
      <div
        ref={gridRef}
        style={gridStyle}
        className={cn(classNameGrid, isAllDisplayed && classNameEnd)}
      >
        {indexesToDisplay.map(i => children(i, layoutIndex))}
        {isAllDisplayed && classNameEnd && <div className={classNameEnd} />}
      </div>
    </div>
  )
}

enum Task {
  // Initial render of a single item:
  INI = 'initial',
  // Invalidate the layout, approximate the window:
  INV = 'invalidate',
  SKR = 'scroll',
  // Stale...
  NIL = 'nil',
}

type State = {
  task: Task,
  offset: number,
  window: number,
  total: number,
  cols: number,
  iH: number,
  iW: number,
  W: number,
  H: number,
}

const initialState: State = {
  task: Task.INI,
  offset: 0,
  window: 1,
  total: 1,
  cols: 1,
  iH: 0,
  iW: 0,
  W: 0,
  H: 0,
}

const renderBounds = (s: State): [number, number] => {
  let [b, e] = [0, 0]

  if (s.cols === 1 || s.window < s.cols) {
    b = s.offset - s.window
    e = s.offset + s.window + s.cols // 1 more row
  } else {
    const wndC = Math.ceil(s.window / s.cols) * s.cols
    const oRow = Math.floor(s.offset / s.cols)
    const o = oRow * s.cols

    b = o - wndC
    e = o + wndC + s.cols // 1 more row
  }

  if (b < 0) {
    b = 0
  }

  if (s.total && e > s.total) {
    e = s.total
  }

  return [b, e]
}

const renderRange = (s: State, [b, e]: [number, number]): number[] => {
  if (s.task === Task.INI) {
    return [0] //<-- render single element
  }

  const range = iRange(b, e)
  return range.length ? range : [0]
}

export default Everscroll
