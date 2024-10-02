import { createRoot } from 'react-dom/client'
import Main from 'sources/main/Main'

const reactRoot = createRoot(document.body)

document.addEventListener('DOMContentLoaded', () => {
  reactRoot.render(<Main />);
})
