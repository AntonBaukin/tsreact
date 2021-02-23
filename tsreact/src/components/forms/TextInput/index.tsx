import debounce from 'lodash/debounce'
import { useMemo, useCallback, useEffect } from 'react'
import {
	PropTypes,
	propTypes,
	defaultProps,
	OnChangeEvent,
	OnTextChangeLater,
} from './props'

/**
 * Fully controlled text input with debounce support.
 */
const TextInput = ({
	value,
	onChange,
	id,
	name,
	type,
	placeholder,
	debounce: debounceTime,
	onChangeLater,
	className,
}: PropTypes) => {
	const isDebounced = debounceTime !== undefined && debounceTime > 0

	const onChangeDebounced: OnTextChangeLater | undefined = useMemo(
		() => (
			debounceTime && debounceTime > 0 && onChangeLater
				? debounce(onChangeLater, debounceTime)
				: undefined
		),
		[debounceTime, onChangeLater]
	)

	const onChangeMixed = useCallback(
		(event: OnChangeEvent) => {
			const { value } = event.target

			onChange(value, event)
			if (onChangeDebounced) {
				onChangeDebounced(value)
			}
		},
		[onChange, onChangeDebounced]
	)

	useEffect(
		() => () => {
			if (onChangeDebounced !== undefined) {
				(onChangeDebounced as any).cancel()
			}
		},
		[onChangeDebounced]
	)

	return (
		<input
			id={id}
			name={name}
			type={type}
			value={value}
			placeholder={placeholder}
			onChange={onChangeMixed}
			className={className}
		/>
	)
}

TextInput.propTypes = propTypes
TextInput.defaultProps = defaultProps

export default TextInput
