
export type JsonValue = string|number|boolean|null|Json|JsonArray

export interface Json {
	[x: string]: JsonValue
}

export interface JsonArray extends Array<JsonValue> {
}

