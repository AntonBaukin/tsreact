import { useState, useCallback } from 'react'
import classNames from 'classnames'
import Scrollbars from 'src/components/Scrollbars'
import TextInput from 'src/components/forms/TextInput'
import styles from './styles.module.scss'

const Search = () => {
	const [value, setValue] = useState('')

	const doSearch = useCallback(
		(value) => console.log('Search!', value),
		[]
	)

	return (
		<div className={styles.search}>
			<Scrollbars className={styles.scroll}>
				<TextInput
					value={value}
					onChange={setValue}
					onChangeLater={doSearch}
					debounce={2000}
				/>
			</Scrollbars>
		</div>
	)
}

export default Search
