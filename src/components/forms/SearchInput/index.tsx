import { useState, useCallback } from 'react'
import classNames from 'classnames'
import Icon from 'src/components/Icon'
import TextInput from '../TextInput'
import { PropTypes, propTypes, defaultProps } from './props'
import styles from './styles.module.scss'

const SearchInput = ({
	id,
	initialValue,
	onSearch,
	debounce,
	placeholder,
	className,
}: PropTypes) => {
	const [value, setValue] = useState(initialValue)

	const onClear = useCallback(
		() => {
			setValue('')
			onSearch('')
		},
		[]
	)

	return (
		<div className={classNames('input-group', styles.inputGroup, className)}>
			<span className="input-group-text">
				<label htmlFor={id}>
					<Icon name="search"/>
				</label>
			</span>

			<TextInput
				id={id}
				value={value}
				onChange={setValue}
				onChangeLater={onSearch}
				debounce={debounce}
				placeholder={placeholder}
				className={classNames('form-control', styles.searchInput)}
			/>

			<button
				className="btn btn-dark"
				onClick={onClear}
			>
				<Icon name="x-circle" size="1.25rem"/>
			</button>
		</div>
	)
}

SearchInput.propTypes = propTypes
SearchInput.defaultProps = defaultProps

/*

<label htmlFor={id} className="form-label input-group-text">

			</label>

 */

export default SearchInput
