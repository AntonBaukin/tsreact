import { FC } from 'react'

export type ReactHoc<P = {}> = (Component: FC<P>) => FC<P>

export const composeReactHocs = <P = {}>(...hocs: ReactHoc<P>[]): ReactHoc<P> =>
  (Component: FC<P>) => hocs.reduce((acc: FC<P>, hoc: ReactHoc<P>) => hoc(acc), Component)
