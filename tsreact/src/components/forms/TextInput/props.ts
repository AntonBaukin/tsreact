import { ChangeEvent } from 'react'
import { string, number, func, oneOf } from 'prop-types'

export enum TextInputType {
	TEXT = 'text',
	NUMBER = 'number',
	PASSWORD = 'password',
}

const TEXT_INPUT_TYPES = Object.values(TextInputType)

export const propTypes = {
	value: string.isRequired,

	// Synchronous callback of the field change.
	// Used to save the controlled value.
	onChange: func.isRequired,

	name: string,
	type: oneOf(TEXT_INPUT_TYPES),
	placeholder: string,

	// Optional number of milliseconds to defer the on change callback.
	debounce: number,
	onChangeLater: func,

	className: string,
} as const

export type OnChangeEvent = ChangeEvent<HTMLInputElement>

export type OnTextChange = (value: string, event?: OnChangeEvent) => void | boolean

export type OnTextChangeLater = (value: string) => void

export interface PropTypes {
	value: string,
	onChange: OnTextChange,
	name?: string,
	type?: TextInputType,
	placeholder?: string,
	debounce?: number,
	onChangeLater?: OnTextChangeLater,
	className?: string,
}

export const defaultProps = {
	type: TextInputType.TEXT,
} as const
