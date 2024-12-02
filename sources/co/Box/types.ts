import { ReactNode } from 'react'

export type Variant =
  | 'f'   // frame box
  | 'L'   // line of frame boxes
  | 'fl'  // frame line left decorator
  | 'fr'  // frame line right decorator
  | 'ff'  // frame line space filler

export interface BoxProps {
  v: Variant,
  children?: ReactNode,
  className?: string,
}


// <div className={styles.frameline} style={{ marginBottom: '50px'}}>
//
//         <Frame>
//           <button>Some text</button>
//         </Frame>
//         <Frame>
//           <button>Else item</button>
//         </Frame>
//         <Frame>
//           <button>More info of a long long content</button>
//         </Frame>
//
//       </div>
//
//       <div className={styles.frameline} style={{ marginBottom: '50px'}}>
//         <Frame>
//           <div style={{ width: '500px', height: '300px', background: 'lightgrey' }} />
//         </Frame>
//       </div>
