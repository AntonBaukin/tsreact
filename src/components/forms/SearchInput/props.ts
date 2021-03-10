import { string, number, func } from 'prop-types'
import { OnTextChangeLater } from '../TextInput/props'

export const propTypes = {
	id: string.isRequired,
	initialValue: string,
	onSearch: func.isRequired,
	debounce: number,
	placeholder: string,
	className: string,
}

export interface PropTypes {
	id: string,
	initialValue: string,
	onSearch: OnTextChangeLater,
	debounce: number,
	placeholder?: string,
	className?: string,
}

export const defaultProps = {
	initialValue: '',
	debounce: 1000,
} as const
