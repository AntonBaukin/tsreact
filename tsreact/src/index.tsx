import ReactDOM from 'react-dom'
import Main from './Main'

const MAIN_APP_ID = 'main'

document.addEventListener('DOMContentLoaded', () => {
	ReactDOM.render(<Main />, document.body.querySelector(`#${MAIN_APP_ID}`))
})
