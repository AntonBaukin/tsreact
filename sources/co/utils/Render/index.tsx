import { FC, useState, useRef, useMemo, useCallback, CSSProperties } from 'react'
import { RenderProps } from './types'

const Render: FC<RenderProps> = ({ onReady, children }) => {
  const [ready, setReady] = useState(false)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      onReadyRef.current(node)
      setReady(true)
    }
  }, []);

  const style: CSSProperties = useMemo(
    () => ({ display: 'none', position: 'absolute' }),
    [],
  )

  return (
    <div ref={setRef} style={style}>
      {children}
    </div>
  )
}

export default Render
